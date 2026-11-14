export interface ProjectFile {
  id: string;
  name: string;
  folder: 'server' | 'web' | 'execution-engine' | 'shared' | 'root';
  language: string;
  content: string;
}
