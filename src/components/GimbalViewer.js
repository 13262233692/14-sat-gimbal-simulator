import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
export default function GimbalViewer({ state }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const azimuthGroupRef = useRef(null);
    const elevationGroupRef = useRef(null);
    const rollGroupRef = useRef(null);
    const animationRef = useRef(0);
    const targetStateRef = useRef(null);
    const currentStateRef = useRef({ az: 0, el: 0, roll: 0 });
    useEffect(() => {
        if (!containerRef.current)
            return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e1a);
        scene.fog = new THREE.Fog(0x0a0e1a, 8, 25);
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(4, 3, 5);
        camera.lookAt(0, 0.5, 0);
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        scene.add(ambientLight);
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        scene.add(mainLight);
        const fillLight = new THREE.DirectionalLight(0x5b9dff, 0.4);
        fillLight.position.set(-5, 3, -5);
        scene.add(fillLight);
        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.3);
        rimLight.position.set(0, 5, -8);
        scene.add(rimLight);
        const gridHelper = new THREE.GridHelper(10, 20, 0x2a3a5a, 0x1a2538);
        gridHelper.position.y = -1.5;
        scene.add(gridHelper);
        const baseGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a4a6a,
            metalness: 0.8,
            roughness: 0.3,
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -1.35;
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        const baseRingGeometry = new THREE.TorusGeometry(1.1, 0.05, 16, 64);
        const baseRingMaterial = new THREE.MeshStandardMaterial({
            color: 0x5b9dff,
            emissive: 0x2a5a9a,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.2,
        });
        const baseRing = new THREE.Mesh(baseRingGeometry, baseRingMaterial);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = -1.2;
        scene.add(baseRing);
        const azimuthGroup = new THREE.Group();
        azimuthGroup.position.y = -1.2;
        scene.add(azimuthGroup);
        azimuthGroupRef.current = azimuthGroup;
        const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 16);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5a7a,
            metalness: 0.7,
            roughness: 0.4,
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = 0.75;
        pillar.castShadow = true;
        azimuthGroup.add(pillar);
        const yokeGeometry = new THREE.BoxGeometry(0.3, 0.3, 2.5);
        const yokeMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a6a8a,
            metalness: 0.7,
            roughness: 0.35,
        });
        const yoke = new THREE.Mesh(yokeGeometry, yokeMaterial);
        yoke.position.y = 1.5;
        yoke.castShadow = true;
        azimuthGroup.add(yoke);
        const elevationGroup = new THREE.Group();
        elevationGroup.position.y = 1.5;
        azimuthGroup.add(elevationGroup);
        elevationGroupRef.current = elevationGroup;
        const eleAxisL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), pillarMaterial);
        eleAxisL.rotation.z = Math.PI / 2;
        eleAxisL.position.x = -1.25;
        eleAxisL.castShadow = true;
        elevationGroup.add(eleAxisL);
        const eleAxisR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), pillarMaterial);
        eleAxisR.rotation.z = Math.PI / 2;
        eleAxisR.position.x = 1.25;
        eleAxisR.castShadow = true;
        elevationGroup.add(eleAxisR);
        const rollGroup = new THREE.Group();
        elevationGroup.add(rollGroup);
        rollGroupRef.current = rollGroup;
        const payloadBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.2, 24), new THREE.MeshStandardMaterial({
            color: 0x6a7a9a,
            metalness: 0.8,
            roughness: 0.25,
        }));
        payloadBody.rotation.x = Math.PI / 2;
        payloadBody.castShadow = true;
        rollGroup.add(payloadBody);
        const frontRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 16, 32), new THREE.MeshStandardMaterial({
            color: 0x5b9dff,
            emissive: 0x2a5a9a,
            emissiveIntensity: 0.6,
            metalness: 0.9,
            roughness: 0.15,
        }));
        frontRing.rotation.y = Math.PI / 2;
        frontRing.position.z = 0.6;
        rollGroup.add(frontRing);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshStandardMaterial({
            color: 0x1a2a4a,
            emissive: 0x0a1a2a,
            emissiveIntensity: 0.3,
            metalness: 0.95,
            roughness: 0.1,
        }));
        lens.position.z = 0.61;
        rollGroup.add(lens);
        const lensGlow = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshBasicMaterial({
            color: 0x5b9dff,
            transparent: true,
            opacity: 0.4,
        }));
        lensGlow.position.z = 0.62;
        rollGroup.add(lensGlow);
        const rearCap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 24), new THREE.MeshStandardMaterial({
            color: 0x5a6a8a,
            metalness: 0.7,
            roughness: 0.35,
        }));
        rearCap.rotation.x = -Math.PI / 2;
        rearCap.position.z = -0.75;
        rearCap.castShadow = true;
        rollGroup.add(rearCap);
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), new THREE.MeshStandardMaterial({
            color: 0x8a9aba,
            metalness: 0.9,
            roughness: 0.2,
        }));
        antenna.position.y = 0.5;
        antenna.castShadow = true;
        rollGroup.add(antenna);
        const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({
            color: 0xff6b9d,
            emissive: 0xff3a6a,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.2,
        }));
        antTip.position.y = 0.76;
        rollGroup.add(antTip);
        const azimuthIndicator = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), new THREE.MeshStandardMaterial({
            color: 0xff6b9d,
            emissive: 0xff3a6a,
            emissiveIntensity: 0.6,
        }));
        azimuthIndicator.position.set(0, -1.05, 0.8);
        azimuthGroup.add(azimuthIndicator);
        let angle = 0;
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            angle += 0.003;
            const radius = 6;
            camera.position.x = Math.cos(angle) * radius;
            camera.position.z = Math.sin(angle) * radius;
            camera.position.y = 3 + Math.sin(angle * 0.7) * 0.5;
            camera.lookAt(0, 0.3, 0);
            if (targetStateRef.current) {
                const target = targetStateRef.current;
                const cur = currentStateRef.current;
                const lerpFactor = 0.15;
                cur.az += (target.theta_az - cur.az) * lerpFactor;
                cur.el += (target.theta_el - cur.el) * lerpFactor;
                cur.roll += (target.theta_roll - cur.roll) * lerpFactor;
                if (azimuthGroupRef.current) {
                    azimuthGroupRef.current.rotation.y = cur.az;
                }
                if (elevationGroupRef.current) {
                    elevationGroupRef.current.rotation.x = cur.el;
                }
                if (rollGroupRef.current) {
                    rollGroupRef.current.rotation.z = cur.roll;
                }
            }
            renderer.render(scene, camera);
        };
        animate();
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer)
                return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationRef.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            renderer.dispose();
        };
    }, []);
    useEffect(() => {
        if (state) {
            targetStateRef.current = state;
        }
    }, [state]);
    return _jsx("div", { ref: containerRef, className: "viewer-canvas" });
}
