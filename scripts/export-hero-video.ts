import { mkdir, rename, rm } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

import { chromium } from "playwright"

type Options = {
  durationMs: number
  height: number
  isolateHero: boolean
  output: string
  theme: "light" | "dark"
  url: string
  width: number
}

const DEFAULTS: Options = {
  url: "https://velvetdinosaur.com/",
  output: "artifacts/hero-video/velvetdinosaur-hero.webm",
  width: 1080,
  height: 1350,
  durationMs: 6500,
  isolateHero: true,
  theme: "light",
}

function printHelp() {
  console.log(`
Record the Velvet Dinosaur homepage hero as a video.

Usage:
  bun run export:hero-video [--url URL] [--output FILE] [--width N] [--height N] [--durationMs N] [--theme light|dark] [--keep-page]

Examples:
  bun run export:hero-video
  bun run export:hero-video --output artifacts/hero-video/facebook-hero.webm
  bun run export:hero-video --width 1200 --height 1200 --durationMs 5000
`.trim())
}

function parseArgs(argv: string[]): Options {
  const options = { ...DEFAULTS }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    }

    if (arg === "--keep-page") {
      options.isolateHero = false
      continue
    }

    const next = argv[index + 1]
    if (!next) {
      throw new Error(`Missing value for ${arg}`)
    }

    if (arg === "--url") {
      options.url = next
      index += 1
      continue
    }

    if (arg === "--output") {
      options.output = next
      index += 1
      continue
    }

    if (arg === "--width") {
      options.width = parseNumber(arg, next)
      index += 1
      continue
    }

    if (arg === "--height") {
      options.height = parseNumber(arg, next)
      index += 1
      continue
    }

    if (arg === "--durationMs") {
      options.durationMs = parseNumber(arg, next)
      index += 1
      continue
    }

    if (arg === "--theme") {
      if (next !== "light" && next !== "dark") {
        throw new Error(`Invalid theme "${next}". Use "light" or "dark".`)
      }
      options.theme = next
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function parseNumber(flag: string, value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid value for ${flag}: ${value}`)
  }
  return Math.round(parsed)
}

function hasFfmpeg() {
  return spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0
}

async function convertToMp4(inputPath: string) {
  const outputPath = inputPath.replace(/\.webm$/i, ".mp4")

  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { stdio: "inherit" },
  )

  if (result.status !== 0) {
    throw new Error("ffmpeg failed while converting the recording to MP4.")
  }

  return outputPath
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const outputPath = path.resolve(options.output)
  const outputExt = path.extname(outputPath).toLowerCase()
  const outputDir = path.dirname(outputPath)
  const tempDir = path.join(outputDir, ".tmp-playwright-video")
  const finalWebmPath =
    outputExt === ".mp4" ? outputPath.replace(/\.mp4$/i, ".webm") : outputPath

  if (outputExt !== ".webm" && outputExt !== ".mp4") {
    throw new Error('Output file must end in ".webm" or ".mp4".')
  }

  if (outputExt === ".mp4" && !hasFfmpeg()) {
    throw new Error('MP4 output requires ffmpeg. Either install ffmpeg or use a ".webm" output path.')
  }

  await rm(tempDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    colorScheme: options.theme,
    recordVideo: {
      dir: tempDir,
      size: {
        width: options.width,
        height: options.height,
      },
    },
    viewport: {
      width: options.width,
      height: options.height,
    },
  })

  const page = await context.newPage()
  const video = page.video()

  try {
    await page.goto(options.url, { waitUntil: "load", timeout: 60_000 })
    await page.locator("#home").waitFor({ state: "visible", timeout: 30_000 })
    await page.waitForFunction(() => document.fonts?.status === "loaded", undefined, { timeout: 30_000 })

    if (options.isolateHero) {
      await page.addStyleTag({
        content: `
          header,
          [aria-label="Chat on WhatsApp"] {
            display: none !important;
          }

          main {
            padding-top: 0 !important;
          }

          main > :not(#home) {
            display: none !important;
          }

          html,
          body {
            overflow: hidden !important;
          }

          #home {
            min-height: 100vh !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            display: flex !important;
            align-items: center !important;
          }
        `,
      })
      await page.waitForTimeout(250)
    }

    await page.locator("#home").scrollIntoViewIfNeeded()
    await page.waitForTimeout(options.durationMs)

    await context.close()
    const recordedPath = await video?.path()
    if (!recordedPath) {
      throw new Error("Playwright did not produce a recording.")
    }

    await rename(recordedPath, finalWebmPath)
    await browser.close()
    await rm(tempDir, { recursive: true, force: true })

    console.log(`Saved WebM recording to ${finalWebmPath}`)

    if (outputExt === ".mp4") {
      const mp4Path = await convertToMp4(finalWebmPath)
      console.log(`Saved MP4 copy to ${mp4Path}`)
      await rm(finalWebmPath, { force: true })
      return
    }

    if (hasFfmpeg()) {
      const mp4Path = await convertToMp4(finalWebmPath)
      console.log(`Saved MP4 copy to ${mp4Path}`)
    } else {
      console.log("ffmpeg not found, so no MP4 copy was created.")
      console.log("Install ffmpeg or convert the WebM to MP4 in HandBrake/CloudConvert for Facebook upload.")
    }
  } catch (error) {
    await browser.close().catch(() => {})
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
