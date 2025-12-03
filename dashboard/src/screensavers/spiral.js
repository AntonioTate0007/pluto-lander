/**
 * Spiral Screensaver
 * Rotating spiral pattern
 */

export function initSpiral(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  let angle = 0
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  
  function draw() {
    ctx.fillStyle = 'rgba(13, 13, 13, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = '#ffc107'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let i = 0; i < 500; i++) {
      const t = i / 50
      const r = t * 5
      const x = centerX + Math.cos(t + angle) * r
      const y = centerY + Math.sin(t + angle) * r
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()
    angle += 0.02
    
    requestAnimationFrame(draw)
  }
  
  draw()
}
