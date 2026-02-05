const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');

// Path to the log file shared with the Electron app
const LOG_PATH = path.join(__dirname, '../app.log');
const STATE_PATH = path.join(__dirname, '../state.json');

const server = new Server(
    {
        name: 'js-blueprints-observer',
        version: '1.1.0',
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// 1. Resources: Expose logs and state
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'file:///app.log',
                name: 'Application Console Logs',
                mimeType: 'text/plain',
                description: 'Real-time logs captured from the Electron Renderer and Main processes'
            },
            {
                uri: 'file:///state.json',
                name: 'Application Zustand State',
                mimeType: 'application/json',
                description: 'The current state of the application stores'
            }
        ]
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const filePath = request.params.uri === 'file:///app.log' ? LOG_PATH :
        request.params.uri === 'file:///state.json' ? STATE_PATH : null;

    if (filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return { contents: [{ uri: request.params.uri, text: '(File not found)' }] };
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return {
                contents: [{
                    uri: request.params.uri,
                    mimeType: filePath.endsWith('.json') ? 'application/json' : 'text/plain',
                    text: data
                }]
            };
        } catch (err) {
            throw new Error(`Failed to read resource: ${err.message}`);
        }
    }
    throw new Error('Resource not found');
});

// 2. Tools: Add a tool to clear logs or Tail logs
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'clear_app_logs',
                description: 'Clears the application log file',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'get_recent_logs',
                description: 'Returns the last N lines of the application log',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lines: { type: 'number', default: 50 }
                    }
                }
            },
            {
                name: 'get_zustand_state',
                description: 'Returns the full current state of the application stores',
                inputSchema: { type: 'object', properties: {} }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case 'clear_app_logs':
            fs.writeFileSync(LOG_PATH, '');
            return { content: [{ type: 'text', text: 'Logs cleared successfully.' }] };

        case 'get_recent_logs': {
            if (!fs.existsSync(LOG_PATH)) return { content: [{ type: 'text', text: 'Log file does not exist.' }] };
            const lines = request.params.arguments?.lines || 50;
            const content = fs.readFileSync(LOG_PATH, 'utf-8').split('\n').slice(-lines).join('\n');
            return { content: [{ type: 'text', text: content }] };
        }

        case 'get_zustand_state': {
            if (!fs.existsSync(STATE_PATH)) return { content: [{ type: 'text', text: 'State file not populated yet.' }] };
            const state = fs.readFileSync(STATE_PATH, 'utf-8');
            return { content: [{ type: 'text', text: state }] };
        }

        default:
            throw new Error('Tool not found');
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('JS Blueprints MCP Observer running on stdio');
}

main().catch((err) => {
    console.error('MCP Server Error:', err);
    process.exit(1);
});
