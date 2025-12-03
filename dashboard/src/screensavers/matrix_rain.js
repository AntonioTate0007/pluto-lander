/**
 * Matrix Rain Screensaver
 * Green code rain effect
 */

export function initMatrixRain(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  const chars = '01PLUTOLANDER'
  const fontSize = 14
  const columns = canvas.width / fontSize
  const drops = []
  
  for (let x = 0; x < columns; x++) {
    drops[x] = Math.random() * -100
  }
  
  function draw() {
    ctx.fillStyle = 'rgba(13, 13, 13, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#22c55e'
    ctx.font = `${fontSize}px monospace`
    
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)]
      const x = i * fontSize
      const y = drops[i] * fontSize
      
      ctx.fillText(text, x, y)
      
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
    
    requestAnimationFrame(draw)
  }
  
  draw()
}
