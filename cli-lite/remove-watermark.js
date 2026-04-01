import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { calculateAlphaMap } from './src/core/alphaMap.js';
import { processWatermarkImageData } from './src/core/watermarkProcessor.js';
import { interpolateAlphaMap } from './src/core/adaptiveDetector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Gemini Watermark Remover (Lite CLI)');
        console.log('用法: node remove-watermark.js <输入文件/文件夹> [输出文件/文件夹]');
        process.exit(1);
    }

    const inputPath = path.resolve(args[0]);
    const outputPath = args[1] ? path.resolve(args[1]) : null;

    // 1. 初始化引擎参考图 (从 assets 加载)
    console.log('[-] 正在初始化引擎...');
    const alpha48Raw = await sharp(path.join(__dirname, 'src/assets/bg_48.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alpha96Raw = await sharp(path.join(__dirname, 'src/assets/bg_96.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const alpha48 = calculateAlphaMap({
        width: alpha48Raw.info.width,
        height: alpha48Raw.info.height,
        data: new Uint8ClampedArray(alpha48Raw.data)
    });
    const alpha96 = calculateAlphaMap({
        width: alpha96Raw.info.width,
        height: alpha96Raw.info.height,
        data: new Uint8ClampedArray(alpha96Raw.data)
    });

    const engineOptions = {
        alpha48,
        alpha96,
        maxPasses: 4,
        getAlphaMap: (size) => {
            if (size === 48) return alpha48;
            if (size === 96) return alpha96;
            return interpolateAlphaMap(alpha96, 96, size);
        }
    };

    // 2. 识别路径并处理
    if (!fs.existsSync(inputPath)) {
        console.error(`错误: 路径不存在 ${inputPath}`);
        process.exit(1);
    }

    if (fs.statSync(inputPath).isDirectory()) {
        const files = fs.readdirSync(inputPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        if (files.length === 0) {
            console.log('错误: 文件夹内没有找到支持的图片格式 (png, jpg, webp)');
            return;
        }
        const outDir = outputPath || path.join(inputPath, 'cleaned');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        for (const file of files) {
            await processFile(path.join(inputPath, file), path.join(outDir, file), engineOptions);
        }
    } else {
        const finalOut = outputPath || buildDefaultOutputPath(inputPath);
        await processFile(inputPath, finalOut, engineOptions);
    }
}

async function processFile(input, output, options) {
    try {
        console.log(`[+] 正在处理: ${path.basename(input)}`);
        
        // 使用 sharp 读取原始像素数据
        const { data, info } = await sharp(input)
            .ensureAlpha() // 确保有 alpha 通道 (RGBA)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const imageData = {
            width: info.width,
            height: info.height,
            data: new Uint8ClampedArray(data)
        };

        // 调用核心核心去除算法
        const result = processWatermarkImageData(imageData, options);

        if (result.meta.applied) {
            // 将处理后的数据写回文件
            const ext = path.extname(output).toLowerCase();
            let finalSharp = sharp(Buffer.from(result.imageData.data), {
                raw: {
                    width: result.imageData.width,
                    height: result.imageData.height,
                    channels: 4
                }
            });

            // 根据输出扩展名选择编码
            if (ext === '.jpg' || ext === '.jpeg') {
                await finalSharp.jpeg({ quality: 95 }).toFile(output);
            } else if (ext === '.webp') {
                await finalSharp.webp({ quality: 100, lossless: true }).toFile(output);
            } else {
                await finalSharp.png().toFile(output);
            }

            console.log(`    ✅ 已保存: ${path.basename(output)} (Passes: ${result.meta.passCount})`);
        } else {
            console.log(`    ⚠️ 未检测到水印或无需处理: ${path.basename(input)}`);
        }
    } catch (err) {
        console.error(`    ❌ 处理失败 ${path.basename(input)}:`, err.message);
    }
}

function buildDefaultOutputPath(input) {
    const parsed = path.parse(input);
    return path.join(parsed.dir, `${parsed.name}_cleaned${parsed.ext}`);
}

run().catch(err => {
    console.error('致命错误:', err);
    process.exit(1);
});
