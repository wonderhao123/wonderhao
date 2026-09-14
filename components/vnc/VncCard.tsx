'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { SpringValue } from '@react-spring/web';
import { VNC_DATA } from '@/lib/vnc-config';
import { HoloOverlay } from './HoloOverlay';
import { Github, Linkedin, Twitter, UserPlus, Globe, Copy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VncCardProps {
  x: SpringValue<number>;
  y: SpringValue<number>;
  isFloating?: boolean; // For desktop mode
}

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/wonderhao' : '';
const LOGO_PATH = `${BASE_PATH}/company_logo.svg`;

export function VncCard({ x, y, isFloating = false }: VncCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Touch interaction state
  const [isTouching, setIsTouching] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for touch-based tilt
  const touchRotateX = useMotionValue(0);
  const touchRotateY = useMotionValue(0);
  const springRotateX = useSpring(touchRotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(touchRotateY, { stiffness: 300, damping: 30 });

  

  const handleCardClick = () => {
    if (!isTouching) {
      setIsFlipped(!isFlipped);
    }
  };
  
  // Touch handlers for mobile interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate position relative to card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    // Convert to rotation angles (-15 to 15 degrees)
    const rotateY = (deltaX / rect.width) * 30;
    const rotateX = -(deltaY / rect.height) * 30;
    
    touchRotateX.set(rotateX);
    touchRotateY.set(rotateY);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsTouching(false);
    
    // Reset tilt
    touchRotateX.set(0);
    touchRotateY.set(0);
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Detect swipe gesture (fast horizontal movement)
    if (velocity > 0.5 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsFlipped(!isFlipped);
    }
    // If it's a tap (no significant movement), treat as click
    else if (distance < 10 && deltaTime < 300) {
      handleCardClick();
    }
  };



  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Github, Linkedin, Twitter
  };

  return (
    <div 
      ref={cardRef}
      className="relative w-[320px] h-120 perspective-1000 cursor-pointer group touch-none" 
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className={cn(
          "w-full h-full relative preserve-3d",
          isFloating && "hover:scale-105"
        )}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{
          rotateX: springRotateX,
          rotateZ: springRotateY,
        }}
        transition={{ 
          duration: 0.5, 
          type: "spring", 
          stiffness: 200, 
          damping: 25,
          mass: 0.8 // Lighter feel for smoother mobile performance
        }}
      >
        {/* FRONT FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden will-change-transform group-hover:border-white/20 transition-colors duration-300">
          <HoloOverlay 
            x={x} 
            y={y} 
            isFlipped={isFlipped} 
            touchTiltX={springRotateX.get()} 
            touchTiltY={springRotateY.get()} 
          />
          
          {/* Enhanced glow on hover (desktop only) */}
          {isFloating && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10" />
            </div>
          )}
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-6 left-6 w-2 h-2 bg-white/50 rounded-full animate-pulse" />
            <div className="absolute top-6 right-6 text-[10px] font-mono text-white/30 tracking-widest">VNC-ID // 8842</div>
            
            {/* Diagonal Lines */}
            <div className="absolute -right-10 top-20 w-40 h-px bg-white/10 rotate-45" />
            <div className="absolute -right-10 top-24 w-40 h-px bg-white/10 rotate-45" />
          </div>

          <div className="relative z-20 flex flex-col h-full p-8 text-white justify-between">
            <div className="mt-8">
               {/* Company Logo */}
               <div className="mb-8">
                 <img 
                   src={LOGO_PATH} 
                   alt="NODEGRIP" 
                   className="h-8 w-auto opacity-90"
                   style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                 />
               </div>

               <h1 
                 className="text-5xl font-bold tracking-tighter leading-[0.9] mb-3 bg-linear-to-br from-white via-white to-white/50 bg-clip-text text-transparent"
               >
                 {VNC_DATA.profile.name.split(' ')[0]}<br />
                 <span className="text-white/40">{VNC_DATA.profile.name.split(' ')[1]}</span>
               </h1>
               
               <div 
                 className="flex items-center gap-2 mt-4"
               >
                 <div className="h-px w-8 bg-cyan-400" />
                 <p className="text-xs font-medium text-cyan-300 uppercase tracking-widest">
                   {VNC_DATA.profile.role}
                 </p>
               </div>
            </div>

            <div 
              className="flex justify-between items-end"
            >
               <div className="flex flex-col gap-1">
                 <div className="flex gap-1">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={`w-1 h-1 rounded-full ${i <= 4 ? 'bg-cyan-400/60' : 'bg-white/10'}`} />
                   ))}
                 </div>
                 <span className="text-[9px] font-mono text-cyan-300/40">C-LEVEL</span>
               </div>
               
               <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/60 group-hover:text-cyan-300 transition-colors">
                 <span>CONNECT</span>
                 <ArrowRight className="w-3 h-3" />
               </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-[#0a0a0a] backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden will-change-transform group-hover:border-white/20 transition-colors duration-300"
          style={{ transform: "rotateY(180deg)" }}
        >
          <HoloOverlay 
            x={x} 
            y={y} 
            isFlipped={isFlipped} 
            touchTiltX={springRotateX.get()} 
            touchTiltY={springRotateY.get()} 
          />
          
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />
          
          <div className="relative z-20 flex flex-col h-full p-8 text-white">
            {/* Header with Company Logo */}
            <div className="flex items-center justify-between mb-6 border-b border-cyan-400/20 pb-4">
              <img 
                src={LOGO_PATH} 
                alt="NODEGRIP" 
                className="h-6 w-auto opacity-80"
                style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.3))' }}
              />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
            </div>
            
            {/* Social Grid */}
            <div className="grid grid-cols-2 gap-3 mb-auto">
              {VNC_DATA.profile.socials.map((social, index) => {
                const Icon = IconMap[social.icon] || Globe;
                return (
                  <motion.a 
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/10 hover:border-cyan-400/30 transition-all group/item relative overflow-hidden aspect-square backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    
                    {/* Tech Corners */}
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-cyan-500/30 group-hover/item:border-cyan-400 transition-colors" />
                    <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-cyan-500/30 group-hover/item:border-cyan-400 transition-colors" />

                    <div className="p-2 text-cyan-400/80 group-hover/item:text-cyan-300 group-hover/item:scale-110 transition-all duration-300 mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-200/50 group-hover/item:text-cyan-100 transition-colors">{social.label}</span>
                  </motion.a>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <motion.button 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/5 hover:bg-cyan-400/10 border border-cyan-400/10 hover:border-cyan-400/30 transition-all group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  alert("vCard Download Triggered");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-4 h-4 text-cyan-400 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/60">Save</span>
              </motion.button>
              
              <motion.button 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/5 hover:bg-cyan-400/10 border border-cyan-400/10 hover:border-cyan-400/30 transition-all group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const email = atob(VNC_DATA.profile.vCard.email);
                    navigator.clipboard.writeText(email);
                    alert("Email Copied");
                  } catch (err) {
                    console.error("Failed to decode email", err);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Copy className="w-4 h-4 text-cyan-400 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/60">Copy</span>
              </motion.button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-cyan-400/10 flex justify-between items-center">
               <span className="text-[9px] text-cyan-300/20 font-mono">NODEGRIP © 2025</span>
               <div className="flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="text-[9px] text-cyan-300/30 font-mono">SECURE</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
