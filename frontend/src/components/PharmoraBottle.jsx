import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const ScrollRotatingBottle = ({ children }) => {
  const groupRef = useRef();
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      const target = scrollY.current * 0.004;
      groupRef.current.rotation.y += (target - groupRef.current.rotation.y) * 0.05;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const BottleModel = () => {
  const [labelTexture, setLabelTexture] = useState(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#4fd1d9';
    ctx.fillRect(0, 0, 1024, 18);
    ctx.fillRect(0, 1006, 1024, 18);
    ctx.beginPath();
    ctx.arc(512, 340, 155, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0f7f9';
    ctx.lineWidth = 28;
    ctx.stroke();

    const crossGrad = ctx.createLinearGradient(512, 180, 512, 500);
    crossGrad.addColorStop(0, '#67e8f9');
    crossGrad.addColorStop(1, '#0891b2');
    ctx.fillStyle = crossGrad;
    const cw = 60, cl = 170, cx = 512, cy = 340;
    ctx.fillRect(cx - cl / 2, cy - cw / 2, cl, cw);
    ctx.fillRect(cx - cw / 2, cy - cl / 2, cw, cl);

    ctx.fillStyle = '#0e4f5c';
    ctx.font = 'bold 110px Arial';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('PHARMORA', 512, 600);

    ctx.fillStyle = '#5eaab8';
    ctx.font = '400 42px Arial';
    ctx.letterSpacing = '10px';
    ctx.fillText('CONNECTING CARE', 512, 710);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    setLabelTexture(tex);
  }, []);

  return (
    <group position={[0, -1, 0]}>
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 2.8, 64]} />
        <meshPhysicalMaterial
          color="#4fd1d9"
          roughness={0.15}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          sheen={1}
          sheenRoughness={0.5}
          sheenColor="#ffffff"
          envMapIntensity={1.2}
        />
      </mesh>

      {labelTexture && (
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[1.015, 1.015, 1.9, 64, 1, true]} />
          <meshStandardMaterial 
            map={labelTexture} 
            roughness={0.8}
            envMapIntensity={0.2} 
            transparent={false}
          />
        </mesh>
      )}

      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[1, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#4fd1d9"
          roughness={0.15}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          sheen={1}
          envMapIntensity={1.2}
        />
      </mesh>

      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.3, 64]} />
        <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
      </mesh>

      <mesh position={[0, 2.71, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.02, 64]} />
        <meshStandardMaterial color="#020202" roughness={0.1} metalness={0.9} />
      </mesh>

      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.42, 0.36, 0.08, 64]} />
        <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};

export default function PharmoraBottle() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1, 16], fov: 28 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        
        <rectAreaLight width={10} height={10} intensity={2} position={[5, 8, 5]} />
        <rectAreaLight width={5} height={5} intensity={1} position={[-5, 2, 2]} />
        
        <spotLight 
          position={[5, 10, 5]} 
          angle={0.3} 
          penumbra={1} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />

        <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
          <ScrollRotatingBottle>
            <BottleModel />
          </ScrollRotatingBottle>
        </Float>

        <ContactShadows position={[0, -2.6, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        
        <Environment preset="city" />
        
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}