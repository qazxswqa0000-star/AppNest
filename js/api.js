import { CONFIG } from "./config.js";
export const DEMO = [
 {id:"1",name:"Lumen Notes",developer:"Nova Labs",category:"Productivity",version:"2.4",size:"18 MB",rating:"4.8",downloads:"120K+",featured:"TRUE",tagline:"Beautiful notes, zero clutter.",description:"A fast, elegant notes app with markdown, folders and offline sync.\n\nDemo data. Connect your Google Sheet to show your own apps.",download_url:"#"},
 {id:"2",name:"Pixel Rush",developer:"Orbit Games",category:"Games",version:"1.9",size:"96 MB",rating:"4.6",downloads:"2.1M+",tagline:"Race through neon worlds.",description:"Fast-paced arcade racing with neon visuals.",download_url:"#"},
 {id:"3",name:"Zen Focus",developer:"Calm Co",category:"Health",version:"3.0",size:"24 MB",rating:"4.9",downloads:"540K+",tagline:"Deep work timer and ambient sounds.",description:"Pomodoro timer with ambient soundscapes.",download_url:"#"},
 {id:"4",name:"SnapEdit Pro",developer:"Pixelcraft",category:"Photo",version:"5.2",size:"62 MB",rating:"4.5",downloads:"890K+",tagline:"Pro photo editing in your pocket.",description:"Filters, curves, healing and RAW support.",download_url:"#"},
 {id:"5",name:"CashFlow",developer:"Nova Labs",category:"Finance",version:"1.2",size:"15 MB",rating:"4.4",downloads:"75K+",tagline:"Track every penny, effortlessly.",description:"Simple expense tracking with beautiful charts.",download_url:"#"},
 {id:"6",name:"Chatterbox",developer:"Hello Inc",category:"Social",version:"7.1",size:"48 MB",rating:"4.3",downloads:"1.4M+",tagline:"Talk to friends, privately.",description:"Private messaging with end-to-end encryption.",download_url:"#"}];
export async function getApps() {
  if (!CONFIG.API_URL) return DEMO;
  try { const j = await (await fetch(CONFIG.API_URL)).json(); localStorage.setItem("an_cache", JSON.stringify(j.apps)); return j.apps; }
  catch (e) { try { return JSON.parse(localStorage.getItem("an_cache")) || []; } catch (_) { return []; } }
}
export async function call(action, password, app) {
  const r = await fetch(CONFIG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, password, app }) });
  return r.json();
}
