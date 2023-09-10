export interface ClientFileLoadPort {
  getLatestKoreanVersionFromRemote(): Promise<number>;
  fetch(name: string): Promise<any[]>;
}

export const ClientFileLoadPortToken = Symbol('ClientFileLoadPort');
