// A small, uncompressed ZIP writer for the editor's Markdown and image bundle.
// Keeping images uncompressed avoids wasted work on formats that are compressed already.
const encoder = new TextEncoder();
const table = Uint32Array.from({ length: 256 }, (_, n) => {
	let value = n;
	for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	return value >>> 0;
});

function crc32(bytes) {
	let value = 0xffffffff;
	for (const byte of bytes) value = table[(value ^ byte) & 255] ^ (value >>> 8);
	return (value ^ 0xffffffff) >>> 0;
}

function header(size) {
	const bytes = new Uint8Array(size);
	return { bytes, view: new DataView(bytes.buffer) };
}

export function createZip(files) {
	const parts = [];
	const directory = [];
	let offset = 0;
	for (const { name, data } of files) {
		if (!name || /[\\/\u0000-\u001f]/.test(name)) throw new Error('묶음에 넣을 파일 이름을 확인해 주세요.');
		const filename = encoder.encode(name);
		const content = typeof data === 'string' ? encoder.encode(data) : data;
		const crc = crc32(content);
		const local = header(30);
		local.view.setUint32(0, 0x04034b50, true);
		local.view.setUint16(4, 20, true);
		local.view.setUint16(6, 0x0800, true); // UTF-8 filenames
		local.view.setUint32(14, crc, true);
		local.view.setUint32(18, content.length, true);
		local.view.setUint32(22, content.length, true);
		local.view.setUint16(26, filename.length, true);
		parts.push(local.bytes, filename, content);
		const central = header(46);
		central.view.setUint32(0, 0x02014b50, true);
		central.view.setUint16(4, 20, true);
		central.view.setUint16(6, 20, true);
		central.view.setUint16(8, 0x0800, true);
		central.view.setUint32(16, crc, true);
		central.view.setUint32(20, content.length, true);
		central.view.setUint32(24, content.length, true);
		central.view.setUint16(28, filename.length, true);
		central.view.setUint32(42, offset, true);
		directory.push(central.bytes, filename);
		offset += local.bytes.length + filename.length + content.length;
	}
	const directorySize = directory.reduce((sum, part) => sum + part.length, 0);
	const end = header(22);
	end.view.setUint32(0, 0x06054b50, true);
	end.view.setUint16(8, files.length, true);
	end.view.setUint16(10, files.length, true);
	end.view.setUint32(12, directorySize, true);
	end.view.setUint32(16, offset, true);
	return new Blob([...parts, ...directory, end.bytes], { type: 'application/zip' });
}
