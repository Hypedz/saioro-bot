import sharp from 'sharp';
import { writeFileSync } from 'fs';

const input = 'C:\\Users\\User\\Documents\\Projetos\\bot-discord\\site\\assets\\avatar.png';
const assets = 'C:\\Users\\User\\Documents\\Projetos\\bot-discord\\site\\assets';

async function main() {
  // 1. WebP version of avatar
  await sharp(input)
    .webp({ quality: 85 })
    .toFile(`${assets}\\avatar.webp`);
  console.log('OK: avatar.webp');

  // 2. apple-touch-icon (180x180)
  await sharp(input)
    .resize(180, 180)
    .png()
    .toFile(`${assets}\\apple-touch-icon.png`);
  console.log('OK: apple-touch-icon.png');

  // 3. favicon.ico with multiple sizes (16, 32, 48)
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map(size => sharp(input).resize(size, size).png().toBuffer())
  );
  
  // Create ICO header
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type (1 = ICO)
  icoHeader.writeUInt16LE(sizes.length, 4); // count

  const dirEntries = [];
  let offset = 6 + sizes.length * 16;
  
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width
    entry.writeUInt8(size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffers[i].length, 8); // size in bytes
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += buffers[i].length;
  }

  const ico = Buffer.concat([icoHeader, ...dirEntries, ...buffers]);
  writeFileSync(`${assets}\\favicon.ico`, ico);
  console.log('OK: favicon.ico');

  console.log('Todos os arquivos gerados!');
}

main().catch(console.error);