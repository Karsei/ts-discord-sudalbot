import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UniversalisService {
    constructor() {
    }

    async fetchCurrentList(server: string, itemId: number) {
        return await axios.get(`https://universalis.app/api/${server}/${itemId}`);
    }
}