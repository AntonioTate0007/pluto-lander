/**
 * BTC Drift Screensaver
 * Floating Bitcoin symbols with drift animation
 */

export function initBTCDrift(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  const symbols = []
  const symbolCount = 20
  
  for (let i = 0; i < symbolCount; i++) {
    symbols.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 20 + Math.random() * 40,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    })
  }
  
  function animate() {
    ctx.fillStyle = 'rgba(13, 13, 13, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    symbols.forEach(symbol => {
      symbol.y += symbol.speed
      symbol.x += Math.sin(symbol.y * 0.01) * 0.5
      symbol.rotation += symbol.rotationSpeed
      
      if (symbol.y > canvas.height) {
        symbol.y = -symbol.size
        symbol.x = Math.random() * canvas.width
      }
      
      ctx.save()
      ctx.translate(symbol.x, symbol.y)
      ctx.rotate(symbol.rotation)
      ctx.globalAlpha = symbol.opacity
      ctx.fillStyle = '#ffc107'
      ctx.font = `${symbol.size}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('₿', 0, 0)
      ctx.restore()
    })
    
    requestAnimationFrame(animate)
  }
  
  animate()
}
