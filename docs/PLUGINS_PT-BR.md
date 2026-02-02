# 🧩 JS Block - Guia de Desenvolvimento de Plugins

Bem-vindo! Este guia explica como criar seus próprios plugins para o **JS Block**. Nosso sistema de plugins foi projetado para ser seguro, isolado e fácil de usar.

---

## 🏗️ Arquitetura

Os plugins no JS Block rodam em um **Extension Host** isolado (um processo filho separado). Isso garante:
- **Estabilidade**: Um plugin lento ou que trave não irá congelar a interface principal do editor.
- **Segurança**: Plugins não têm acesso direto à API do Node.js ou ao DOM. Eles interagem com o app através de uma API restrita chamada `JSBlock`.

---

## 📁 Estrutura de um Plugin

Um plugin é simplesmente uma pasta dentro do diretório de `plugins` do app.

**Caminho padrão:**
- **Linux**: `~/.config/js-blueprints-electron/plugins/`
- **Windows**: `%APPDATA%/js-blueprints-electron/plugins/`
- **macOS**: `~/Library/Application Support/js-blueprints-electron/plugins/`

### 1. `plugin.json` (Manifesto)
Este arquivo diz ao JS Block quem você é e por onde começar.

```json
{
    "id": "meu-plugin-incrivel",
    "name": "Meu Plugin Incrível",
    "version": "1.0.0",
    "description": "Adiciona funcionalidades fantásticas ao JS Block",
    "entry": "index.js"
}
```

### 2. Ponto de Entrada (`index.js`)
Seu código principal deve exportar uma função `activate`.

```javascript
module.exports = {
    /**
     * Chamado quando o plugin é carregado.
     * @param {Object} jsBlock - O objeto da API restrita.
     */
    activate: (jsBlock) => {
        console.log("Meu plugin está vivo!");
        
        // Exemplo: Mostrar uma notificação
        jsBlock.notifications.show("Olá do Meu Plugin Incrível!");
    },

    /**
     * Chamado quando o plugin é desativado ou o app fecha.
     */
    deactivate: () => {
        console.log("Tchau!");
    }
};
```

---

## 🛠️ A API `JSBlock`

O objeto `jsBlock` fornecido à sua função `activate` é o seu portal para o aplicativo.

### `jsBlock.notifications`
- `show(message)`: Exibe uma mensagem de "toast" na interface principal.

*(Mais recursos como acesso ao Workspace e contribuições na barra lateral virão em breve!)*

---

## 🚀 Criando seu primeiro plugin

1.  Navegue até a pasta `plugins`.
2.  Crie uma pasta chamada `hello-world`.
3.  Dentro dela, crie os arquivos `plugin.json` e `index.js`.
4.  Copie os exemplos acima.
5.  Reinicie o **JS Block**.
6.  Você verá sua notificação aparecer após 2 segundos!

---

## 🛡️ Boas Práticas

1.  **Não tente acessar APIs globais do Node**: `fs`, `path` ou `child_process` não estão disponíveis diretamente. Use a API `jsBlock`.
2.  **Async/Await**: Sinta-se à vontade para usar recursos modernos do JS; o host roda em uma versão recente do Node.js.
3.  **Performance**: Mantenha a lógica do `activate` leve. Se precisar de processamento pesado, use `setTimeout` ou `Promise` para não travar a inicialização.
