import fs from 'node:fs';
import {parseEnv} from 'node:util';
export function loadEnv(){return {...(fs.existsSync('.env')?parseEnv(fs.readFileSync('.env','utf8')):{}),...process.env};}
