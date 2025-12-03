/**
 * Warp Tunnel Screensaver
 * 3D tunnel effect
 */

export function initWarp(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  let angle = 0
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  
  function draw() {
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    for (let i = 0; i < 20; i++) {
      const z = i / 20
      const size = (1 - z) * 200
      const x = centerX + Math.cos(angle + i) * size * 0.3
      const y = centerY + Math.sin(angle + i) * size * 0.3
      
      ctx.strokeStyle = `rgba(255, 193, 7, ${1 - z})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    angle += 0.05
    requestAnimationFrame(draw)
  }
  
  draw()
}
