'use client'

import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'

interface IPdfCanvasViewerProps {
  fileUrl: string
}

const PdfCanvasViewer: FC<IPdfCanvasViewerProps> = ({ fileUrl }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const renderTokenRef = useRef(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = renderTokenRef.current + 1
    renderTokenRef.current = token

    const renderPdf = async () => {
      const scrollContainer = scrollRef.current
      const pagesContainer = pagesRef.current

      if (!scrollContainer || !pagesContainer) {
        return
      }

      pagesContainer.replaceChildren()
      setIsLoading(true)
      setError('')

      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

        const pdf = await pdfjs.getDocument({ url: fileUrl }).promise
        const containerWidth = Math.max(scrollContainer.clientWidth - 32, 320)

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (renderTokenRef.current !== token) {
            return
          }

          const page = await pdf.getPage(pageNumber)
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = Math.min(containerWidth / baseViewport.width, 1.35)
          const viewport = page.getViewport({ scale })
          const outputScale = window.devicePixelRatio || 1
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')

          if (!context) {
            return
          }

          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.height = `${Math.floor(viewport.height)}px`
          canvas.className = 'block bg-white'
          context.setTransform(outputScale, 0, 0, outputScale, 0, 0)

          const pageWrap = document.createElement('div')
          pageWrap.className = 'mb-5 flex justify-center bg-white'
          pageWrap.appendChild(canvas)
          pagesContainer.appendChild(pageWrap)

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise
        }
      }
      catch {
        setError('PDF 加载失败')
      }
      finally {
        if (renderTokenRef.current === token) {
          setIsLoading(false)
        }
      }
    }

    renderPdf()

    return () => {
      renderTokenRef.current += 1
    }
  }, [fileUrl])

  return (
    <div className='relative h-full min-h-0 overflow-auto bg-white' ref={scrollRef}>
      <div ref={pagesRef} className='min-h-full bg-white' />
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-white text-[14px] text-[#66736d]'>
          正在加载 PDF...
        </div>
      )}
      {error && (
        <div className='absolute inset-0 flex items-center justify-center bg-white text-[14px] text-[#b42318]'>
          {error}
        </div>
      )}
    </div>
  )
}

export default React.memo(PdfCanvasViewer)
