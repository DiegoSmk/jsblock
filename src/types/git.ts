export interface GitLogEntry {
  hash: string;
  date: string;
  author: string;
  email: string;
  message: string;
  refs?: string;
}

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

export interface GitRemote {
  name: string;
  url: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  content: string;
}

export interface GitCommitDetail extends GitLogEntry {
  files: GitDiff[];
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface GitGraphNode {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  refs: string[];
  x: number;
  y: number;
}

export interface GitGraphEdge {
  from: string;
  to: string;
  branch: string;
}

export interface GitGraph {
  nodes: GitGraphNode[];
  edges: GitGraphEdge[];
}