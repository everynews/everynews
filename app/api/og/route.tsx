import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { db } from '@everynews/database'
import { stories } from '@everynews/schema/story'
import { ImageResponse } from 'next/og'

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') ?? 'Agentic Google Alerts'

  const description =
    searchParams.get('description') ??
    "Semantic Monitoring. Context Understanding. Granular Delivery. Everynews keeps up with the industry so you don't have to."

  const [fonts, logoData] = await Promise.all([
    Promise.all([
      fs.readFile(join(process.cwd(), 'public/fonts/Pretendard-SemiBold.woff')),
      fs.readFile(
        join(process.cwd(), 'public/fonts/PretendardJP-SemiBold.woff'),
      ),
    ]).then(([kr, jp]) => [
      { data: kr, name: 'Pretendard', style: 'normal' },
      { data: jp, name: 'Pretendard JP', style: 'normal' },
    ]),
    fs.readFile(join(process.cwd(), 'public/logo.png')),
  ])

  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  const image = new ImageResponse(
    <div tw='flex flex-col w-full items-start justify-start'>
      <div
        style={{
          backgroundImage: 'linear-gradient(45deg, #000000 0%, #000012 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          wordBreak: 'keep-all',
          wordWrap: 'break-word',
        }}
      >
        <div tw='flex flex-col w-full p-24 pt-16'>
          <h2 tw='items-center text-7xl text-slate-400 text-left flex flex-row gap-20'>
            <img
              src={logoBase64}
              width='80'
              height='80'
              alt='Everynews'
              tw='mr-4'
            />
            <span>Everynews</span>
          </h2>

          <h1 tw='text-pretty text-9xl tracking-tight text-slate-300 text-left font-black leading-tight'>
            {title}
          </h1>

          <span tw='text-7xl leading-normal text-slate-500'>{description}</span>
        </div>

        <div
          style={{
            backgroundImage:
              'linear-gradient(to bottom, transparent 0%, #000000 100%)',
            bottom: 0,
            height: '540px',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
          }}
        />
      </div>
    </div>,
    {
      fonts: [
        {
          data: fonts[0].data,
          name: 'Pretendard',
          style: 'normal',
        },
        {
          data: fonts[1].data,
          name: 'Pretendard JP',
          style: 'normal',
        },
      ],
      height: 1080,
      width: 1920,
    },
  )

  image.headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return image
}

export const generateStaticParams = async () => {
  const allStories = await db.select().from(stories)
  return allStories.map((story) => ({
    description: Array.isArray(story.keyFindings)
      ? story.keyFindings.join(' ')
      : story.keyFindings,
    title: story.title,
  }))
}
