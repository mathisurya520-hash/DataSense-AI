/* ==========================================================================
   DataSense AI - Canvas-Based Futuristic Database & Particle Grid Engine
   ========================================================================== */

class BackgroundEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.bind ? this.canvas.getContext('2d') : null;
    this.container = document.getElementById('background-canvas-container');
    
    if (!this.container) {
      // Create container if missing
      this.container = document.createElement('div');
      this.container.id = 'background-canvas-container';
      document.body.prepend(this.container);
    }
    
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.nodes = [];
    this.connections = [];
    this.particles = []; // Ambient golden dust
    this.dataPackets = []; // Flows along connection lines
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.initEcosystem();
    this.animate();
  }
  
  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  initEcosystem() {
    // 1. Generate network nodes ( botanical/circuit inspired layout )
    const nodeCount = Math.min(35, Math.floor((this.width * this.height) / 45000));
    
    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 4 + 2,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        type: Math.random() > 0.75 ? 'server' : 'neuron'
      });
    }
    
    // 2. Generate connections based on distance thresholds
    this.updateConnections();
    
    // 3. Generate ambient gold/ivory dust particles
    const particleCount = Math.min(60, Math.floor((this.width * this.height) / 25000));
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.15 - 0.1, // Drifts slightly upwards
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '#F4C430' : '#F8F4E3' // Gold vs. Ivory
      });
    }
  }
  
  updateConnections() {
    this.connections = [];
    const maxDistance = 200;
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dist = Math.hypot(this.nodes[i].x - this.nodes[j].x, this.nodes[i].y - this.nodes[j].y);
        if (dist < maxDistance) {
          this.connections.push({
            from: this.nodes[i],
            to: this.nodes[j],
            distance: dist,
            alpha: (1 - dist / maxDistance) * 0.25
          });
          
          // Seed a data packet occasionally along the active line
          if (Math.random() < 0.005) {
            this.dataPackets.push({
              from: this.nodes[i],
              to: this.nodes[j],
              progress: 0,
              speed: 0.005 + Math.random() * 0.01,
              color: '#F4C430' // Golden streams
            });
          }
        }
      }
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Render slow background grid lines (Luxury design)
    this.ctx.strokeStyle = 'rgba(31, 138, 112, 0.03)';
    this.ctx.lineWidth = 1;
    const gridGap = 80;
    
    for (let x = 0; x < this.width; x += gridGap) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridGap) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    // Update & Draw Connections
    this.ctx.lineWidth = 1;
    this.connections.forEach(conn => {
      this.ctx.strokeStyle = `rgba(47, 175, 122, ${conn.alpha})`;
      this.ctx.beginPath();
      this.ctx.moveTo(conn.from.x, conn.from.y);
      this.ctx.lineTo(conn.to.x, conn.to.y);
      this.ctx.stroke();
    });
    
    // Update & Draw flowing golden data packets
    for (let i = this.dataPackets.length - 1; i >= 0; i--) {
      const packet = this.dataPackets[i];
      packet.progress += packet.speed;
      
      if (packet.progress >= 1) {
        this.dataPackets.splice(i, 1);
        continue;
      }
      
      const x = packet.from.x + (packet.to.x - packet.from.x) * packet.progress;
      const y = packet.from.y + (packet.to.y - packet.from.y) * packet.progress;
      
      this.ctx.fillStyle = packet.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Packet trailing glow
      this.ctx.fillStyle = 'rgba(244, 196, 48, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Update & Draw Nodes
    this.nodes.forEach(node => {
      // Motion
      node.x += node.vx;
      node.y += node.vy;
      
      // Bounce boundaries
      if (node.x < 0 || node.x > this.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.height) node.vy *= -1;
      
      // Pulsate scale
      node.pulseOffset += node.pulseSpeed;
      const pulseFactor = Math.sin(node.pulseOffset) * 2 + 3;
      
      if (node.type === 'server') {
        // Glowing Server Cylinder/Hex icon
        this.ctx.fillStyle = '#2FAF7A'; // Jade Green
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glow outline ring
        this.ctx.strokeStyle = 'rgba(244, 196, 48, 0.4)'; // Golden glow
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + pulseFactor, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        // Standard neural junction node
        this.ctx.fillStyle = 'rgba(31, 138, 112, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Update & Draw Ambient Dust
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0) p.y = this.height; // Wrap vertical drift
      
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0; // Reset
    });
    
    // Periodically update network lines mapping changes
    if (Math.random() < 0.02) {
      this.updateConnections();
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.backgroundEngine = new BackgroundEngine();
});
