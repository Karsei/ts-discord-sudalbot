export interface LodestoneLoadPort {
  searchItemUrl(searchWord: string): Promise<string>;
}

export const LodestoneLoadPortToken = Symbol('LodestoneLoadPort');
