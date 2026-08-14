  async function handlePrintDirectly() {
    setGenerating(true)
    try {
      const doc = await buildLabelPdf(shipment!, printedAt)
      // Use a real Blob + object URL rather than the data-URI form —
      // more reliable for multi-page PDFs loading fully in an iframe
      const blob = doc.output('blob')
      const blobUrl = URL.createObjectURL(blob)
      const frame = printFrameRef.current
      if (!frame) return

      frame.onload = () => {
        // Small delay ensures the PDF viewer has rendered every page,
        // not just the container, before the print dialog opens
        setTimeout(() => {
          try {
            frame.contentWindow?.focus()
            frame.contentWindow?.print()
          } catch {
            doc.save(`${shipment!.tracking_number}-label.pdf`)
          }
        }, 300)
      }
      frame.src = blobUrl
    } finally {
      setGenerating(false)
    }
  }
