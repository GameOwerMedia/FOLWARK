import {isBarrier,isGate,barrierSegment} from '../simulation/Barriers';
import {prepareWildlifeArt} from './WildlifeArt';
import {t} from '../i18n';
import Phaser from 'phaser';
import {saveGame} from './SaveStore';
import { frames } from './Atlas';
import {preloadAssets,finishAssetLoading} from './AssetLoading';
import { drawTerrain } from './Terrain';
import { makeGaits, GAIT_FRAMES } from './Gait';
import { Frontier } from './Frontier';
import { Atmosphere } from './Atmosphere';
import {snowTexture} from './SeasonArt';
import { RoadLayer } from './RoadLayer';
import type { RoadKind } from '../simulation/Development';
import { recipes } from '../simulation/Development';
import { decorations, regions, nearRoad } from '../simulation/Landscape';
import { World, WIDTH, HEIGHT, buildingDefs, speciesNames, type BuildingKind, type Resident } from '../simulation/World';

type UnitView={sprite:Phaser.GameObjects.Image;ring:Phaser.GameObjects.Ellipse;label:Phaser.GameObjects.Text;shadow:Phaser.GameObjects.Ellipse};
export class FarmScene extends Phaser.Scene {
  menuOpen=false;reducedMotion=false;cameraSpeed=.7;autosaveSeconds=20;
  world=new World('survival'); selected:string[]=['unit-100']; selectedBuilding:number|null=null;
  mode:'select'|'move'|'build'|'pan'|'road'|'erase-road'|'patrol'|'guard'='select';
  roadKind:RoadKind='dirt';roadStart:{x:number;y:number}|null=null;edgeScroll=true;
  private atmosphere!:Atmosphere;
  private roadLayer!:RoadLayer;private roadVersion=-1;private preview!:Phaser.GameObjects.Graphics;private effects!:Phaser.GameObjects.Graphics; buildKind:BuildingKind='field';
  onNeighbor=(_id:string)=>{};private frontier!:Frontier;
  onChange=()=>{}; onReady=()=>{}; private unitViews=new Map<string,UnitView>();
  private buildingViews=new Map<number,Phaser.GameObjects.Image>(); private decoration:Phaser.GameObjects.Image[]=[];
  private ghost!:Phaser.GameObjects.Image; private selectionBox!:Phaser.GameObjects.Graphics;
  private orderMark!:Phaser.GameObjects.Graphics; private clockText!:Phaser.GameObjects.Text;
  private dragStart:{x:number;y:number;wx:number;wy:number}|null=null; private panning=false;
  private viewCenter={x:870,y:620};
  private keys!:Record<string,Phaser.Input.Keyboard.Key>; private renderClock=0; private autosaveClock=0;
  constructor(){super('FarmScene')}
  preload(){preloadAssets(this)}
  create(){finishAssetLoading(this,()=>this.createFarm())}
  private createFarm(){
    prepareWildlifeArt(this);
    for(const[key,f]of Object.entries(frames))this.textures.get(f.sheet).add(key,0,...f.rect);
    this.cameras.main.setBackgroundColor('#414d35');
    drawTerrain(this,this.world.season,this.world.buildings);this.drawDecorations();this.frontier=new Frontier(this);makeGaits(this,Object.keys(speciesNames));
    this.roadLayer=new RoadLayer(this);this.atmosphere=new Atmosphere(this);this.preview=this.add.graphics().setDepth(5000);this.effects=this.add.graphics().setDepth(3800);

    this.ghost=this.art('field',0,0,210).setDepth(4000).setAlpha(.6).setVisible(false);
    this.selectionBox=this.add.graphics().setDepth(5000);
    this.orderMark=this.add.graphics().setDepth(4000);
    this.clockText=this.add.text(1000,1190,'',{fontFamily:'Georgia',fontSize:'12px',color:'#eed6a0'}).setOrigin(.5,1);
    this.input.mouse?.disableContextMenu();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,SHIFT') as Record<string,Phaser.Input.Keyboard.Key>;
    this.keys.SPACE.on('down',()=>{if(this.menuOpen||document.querySelector('dialog[open]')||['INPUT','BUTTON','TEXTAREA','SELECT'].includes(document.activeElement?.tagName??''))return;this.world.paused=!this.world.paused;this.onChange()});
    this.keys.ESC.on('down',()=>{if(this.menuOpen)return;this.cancelMode();document.dispatchEvent(new Event('close-panel'));this.onChange()});
    const releaseDrag=()=>{this.dragStart=null;this.panning=false;this.selectionBox.clear()};
    this.input.on('pointerupoutside',releaseDrag);
    window.addEventListener('blur',releaseDrag);
    this.events.once('shutdown',()=>window.removeEventListener('blur',releaseDrag));
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.menuOpen)return;
      this.panning=p.middleButtonDown()||this.mode==='pan';
      this.dragStart={x:p.x,y:p.y,wx:p.worldX,wy:p.worldY};
    });
    this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.menuOpen)return;
      if(this.mode==='build'){const x=isBarrier(this.buildKind)?Math.round(p.worldX/50)*50:p.worldX,y=isBarrier(this.buildKind)?Math.round(p.worldY/50)*50:p.worldY;this.ghost.setPosition(x,y).setVisible(true).setTint(this.world.canBuild(this.buildKind,x,y)?0xb9e49a:0xe05f54);}
      if(this.mode==='road'&&this.roadStart){const valid=this.world.roadPlan(this.roadKind,this.roadStart,{x:p.worldX,y:p.worldY}).valid;this.preview.clear().lineStyle(34,valid?0xdbc996:0xd25a48,.65).lineBetween(this.roadStart.x,this.roadStart.y,p.worldX,p.worldY)}
      if(!this.dragStart)return;
      const c=this.cameras.main;
      if(p.rightButtonDown()&&Math.hypot(p.x-this.dragStart.x,p.y-this.dragStart.y)>8)this.panning=true;
      if(this.panning){c.scrollX-=(p.x-p.prevPosition.x)/c.zoom;c.scrollY-=(p.y-p.prevPosition.y)/c.zoom;return}
      if(p.isDown&&this.mode==='select'&&!p.rightButtonDown()){
        const s=this.dragStart;this.selectionBox.clear().lineStyle(1.5,0xe8cb78,.9).fillStyle(0xdcc879,.12).fillRect(s.wx,s.wy,p.worldX-s.wx,p.worldY-s.wy).strokeRect(s.wx,s.wy,p.worldX-s.wx,p.worldY-s.wy);
      }
    });
    this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.menuOpen)return;
      const start=this.dragStart;this.dragStart=null;this.selectionBox.clear();if(!start||this.panning)return;
      const distance=Math.hypot(p.x-start.x,p.y-start.y);
      if(p.rightButtonReleased()){if(this.mode==='road'||this.mode==='build'){this.cancelMode();this.onChange();return}this.contextOrder(p.worldX,p.worldY);return}
      if(this.mode==='road'){const end={x:p.worldX,y:p.worldY};if(!this.roadStart)this.roadStart=end;else if(this.world.buildRoad(this.roadKind,this.roadStart,end)){this.roadStart=end;this.preview.clear()}this.onChange();return}
      if(this.mode==='erase-road'){const road=[...this.world.roads].reverse().find(r=>nearRoad(p.worldX,p.worldY,[r.points],26));if(road)this.world.removeRoad(road.id);this.onChange();return}
      if(this.mode==='patrol'||this.mode==='guard'){this.world.command(this.selected,this.mode,{x:p.worldX,y:p.worldY});this.cancelMode();this.mark(p.worldX,p.worldY);this.onChange();return}
      if(this.mode==='build'){
        if(this.world.build(this.buildKind,isBarrier(this.buildKind)?Math.round(p.worldX/50)*50:p.worldX,isBarrier(this.buildKind)?Math.round(p.worldY/50)*50:p.worldY)){if(!isBarrier(this.buildKind)){this.mode='select';this.ghost.setVisible(false);}this.selectedBuilding=this.world.buildings.at(-1)!.id;this.selected=[]}
      }else if(this.mode==='move'){this.world.move(this.selected,p.worldX,p.worldY,this.keys.SHIFT.isDown);this.mark(p.worldX,p.worldY);this.mode='select'}
      else if(distance>10){
        this.selected=this.world.living.filter(a=>a.x>=Math.min(start.wx,p.worldX)&&a.x<=Math.max(start.wx,p.worldX)&&a.y>=Math.min(start.wy,p.worldY)&&a.y<=Math.max(start.wy,p.worldY)).map(a=>a.id);
        this.selectedBuilding=null;
      }else{
        const unit=this.world.living.filter(a=>this.unitViews.get(a.id)?.sprite.getBounds().contains(p.worldX,p.worldY)).sort((a,b)=>b.y-a.y)[0];
        if(unit){this.selected=this.keys.SHIFT.isDown?[...new Set([...this.selected,unit.id])]:[unit.id];this.selectedBuilding=null}
        else if(this.frontier.siteAt(p.worldX,p.worldY)){this.onNeighbor(this.frontier.siteAt(p.worldX,p.worldY)!)}
        else{const b=this.buildingAt(p.worldX,p.worldY);this.selectedBuilding=b?.id??null;this.selected=[]}
      }
      this.onChange();
    });
    this.input.on('wheel',(p:Phaser.Input.Pointer,_o:unknown,_dx:number,dy:number)=>this.zoomBy(dy>0?-.08:.08,{x:p.x,y:p.y}));
    this.scale.on('resize',()=>this.fitCamera(false));
    this.fitCamera(true);
    this.onReady();document.getElementById('loading')?.remove();
  }
  art(key:string,x:number,y:number,width:number){
    const f=frames[key];return this.add.image(x,y,f.sheet,key).setOrigin(.5,1).setDisplaySize(width,width*f.rect[3]/f.rect[2]).setDepth(y);
  }
  private drawDecorations(){
    for(const d of decorations)this.decoration.push(this.art(d.key,d.x,d.y,d.width));
  }
  private buildingAt(x:number,y:number){
    return [...this.world.buildings].sort((a,b)=>b.y-a.y).find(b=>isBarrier(b.kind)?(b.kind.endsWith('V')?Math.abs(x-b.x)<20&&Math.abs(y-b.y)<65:Math.abs(x-b.x)<55&&Math.abs(y-b.y)<40):this.buildingViews.get(b.id)?.getBounds().contains(x,y));
  }
  contextOrder(x:number,y:number){
    if(!this.selected.length)return;
    const b=this.buildingAt(x,y);
    if(b&&b.progress<1)this.world.assign(this.selected,'build',b.id);
    else if(b&&recipes[b.kind])this.world.assign(this.selected,'produce',b.id);
    else if(b&&['field','garden','orchard'].includes(b.kind))this.world.assign(this.selected,'harvest',b.id);
    else if(b?.kind==='lumber')this.world.assign(this.selected,'wood',b.id);
    else if(b?.kind==='quarry')this.world.assign(this.selected,'stone',b.id);
    else if(b?.kind==='barn')this.world.command(this.selected,'unload');
    else this.world.move(this.selected,x,y,this.keys.SHIFT.isDown);
    this.mark(x,y);this.onChange();
  }
  private mark(x:number,y:number){
    this.orderMark.clear().lineStyle(2,0xf0d78c).strokeEllipse(x,y,35,16).lineBetween(x-23,y,x-12,y).lineBetween(x+12,y,x+23,y);
    this.tweens.killTweensOf(this.orderMark);this.orderMark.setAlpha(1);this.tweens.add({targets:this.orderMark,alpha:0,duration:700});
  }
  cancelMode(){this.dragStart=null;this.panning=false;this.selectionBox?.clear();this.mode='select';this.roadStart=null;this.preview?.clear();this.ghost?.setVisible(false)}
  chooseRoad(kind:RoadKind){this.cancelMode();this.mode='road';this.roadKind=kind;this.onChange()}
  focusBuilding(id:number){const b=this.world.buildings.find(b=>b.id===id);if(!b)return;this.selected=[];this.selectedBuilding=id;this.cameras.main.centerOn(b.x,b.y);this.onChange()}
  chooseBuild(kind:BuildingKind){
    this.cancelMode();
    this.buildKind=kind;this.mode='build';const f=frames[buildingDefs[kind].art],w=buildingDefs[kind].width;
    this.ghost.setTexture(f.sheet,buildingDefs[kind].art).setOrigin(.5,1).setDisplaySize(w,w*f.rect[3]/f.rect[2]);if(isBarrier(kind)&&kind.endsWith('V'))this.ghost.setDisplaySize(26,145).setOrigin(.5,.65);this.onChange();
  }
  focus(id:string){const a=this.world.units.find(a=>a.id===id);if(!a)return;this.selected=[id];this.selectedBuilding=null;this.cameras.main.centerOn(a.x,a.y);this.onChange()}
  center(){this.fitCamera(true)}
  zoomBy(amount:number,point?:{x:number;y:number}){const c=this.cameras.main,p=point??{x:this.scale.width/2,y:this.scale.height/2},before=c.getWorldPoint(p.x,p.y);c.setZoom(Phaser.Math.Clamp(c.zoom+amount,Math.max(this.scale.width/WIDTH,this.scale.height/HEIGHT),1.7));c.centerOn(before.x-(p.x-this.scale.width/2)/c.zoom,before.y-(p.y-this.scale.height/2)/c.zoom)}
  private fitCamera(reset:boolean){
    const c=this.cameras.main;c.setBounds(0,0,WIDTH,HEIGHT);
    const minimum=Math.max(this.scale.width/WIDTH,this.scale.height/HEIGHT);
    if(reset)c.setZoom(Math.max(minimum,Math.min(this.scale.width/1150,this.scale.height/740))).centerOn(870,620);
    else {c.setZoom(Math.max(minimum,c.zoom));c.centerOn(this.viewCenter.x,this.viewCenter.y)}
  }
  resetViews(){this.cancelMode();this.roadVersion=-1;this.unitViews.forEach(v=>{v.sprite.destroy();v.label.destroy();v.ring.destroy();v.shadow.destroy()});this.unitViews.clear();this.buildingViews.forEach(v=>v.destroy());this.buildingViews.clear()}
  update(_time:number,delta:number){
    if(!this.ghost)return;
    if(!this.menuOpen&&!document.hidden&&!document.querySelector('dialog[open]'))this.world.tick(delta/1000);
    if(this.roadVersion!==this.world.roadRevision){this.roadLayer.render(this.world.roads);this.roadVersion=this.world.roadRevision}
    const c=this.cameras.main,step=Math.min(delta,50)*this.cameraSpeed/c.zoom;
    this.game.canvas.style.cursor=this.mode==='pan'?'grab':this.mode==='select'?'default':'crosshair';
    if(!this.menuOpen&&!document.querySelector('dialog[open]')){
      const p=this.input.activePointer;if(this.edgeScroll&&!p.isDown&&this.game.canvas.matches(':hover')&&!p.wasTouch){if(p.x<16)c.scrollX-=step;if(p.x>this.scale.width-16)c.scrollX+=step;if(p.y<16)c.scrollY-=step;if(p.y>this.scale.height-16)c.scrollY+=step}
      if(this.keys.A.isDown||this.keys.LEFT.isDown)c.scrollX-=step;if(this.keys.D.isDown||this.keys.RIGHT.isDown)c.scrollX+=step;
      if(this.keys.W.isDown||this.keys.UP.isDown)c.scrollY-=step;if(this.keys.S.isDown||this.keys.DOWN.isDown)c.scrollY+=step;
    }
    this.atmosphere.update(this.world,this.reducedMotion);this.frontier.update();
    for(let i=0;i<this.decoration.length;i++){
      const d=decorations[i],view=this.decoration[i],tree=['apple','pear','treeOrange','treeWhite','treePink','pine'].includes(d.key);
      if(tree){
        const season=this.world.season,key=season==='Zima'?'winterTree':season==='Jesien'?'treeOrange':season==='Wiosna'?(i%2?'treeWhite':'treePink'):'apple',f=frames[key];
        if(view.frame.name!==key)view.setTexture(f.sheet,key).setDisplaySize(d.width,d.width*f.rect[3]/f.rect[2]);
        view.setTint(season==='Lato'?0xb5d18d:0xffffff);
      }
      if(tree||['flag','reeds'].includes(d.key))view.setRotation(Math.sin((this.reducedMotion?0:this.world.time)*1.15+i*2.3)*(d.key==='flag'?.012:.004));
      if(['flowers','flowersRed','reeds'].includes(d.key))view.setTint(this.world.season==='Zima'?0xd4dfde:0xffffff);
    }
    this.effects.clear();
    for(const [id,view] of this.buildingViews)if(!this.world.buildings.some(b=>b.id===id)){view.destroy();this.buildingViews.delete(id)}
    for(const b of this.world.buildings){
      let view=this.buildingViews.get(b.id);
      if(!view){view=this.art(buildingDefs[b.kind].art,b.x,b.y,buildingDefs[b.kind].width);this.buildingViews.set(b.id,view)}
      if(isBarrier(b.kind)){
        view.setVisible(b.progress<1).setAlpha(.3+b.progress*.7);
        if(b.kind.endsWith('V'))view.setDisplaySize(26,145);else view.setDisplaySize(110,48);
        if(b.progress<1)this.effects.lineStyle(3,0xb4a36b).lineBetween(b.x-35,b.y+8,b.x-35+b.progress*70,b.y+8);
        if(isGate(b.kind))this.effects.lineStyle(2,b.enabled?0xc2654f:0x7bb485).strokeEllipse(b.x,b.y,26,12);
        if(b.id===this.selectedBuilding)this.effects.lineStyle(2,0xf2d877).strokeEllipse(b.x,b.y,105,28);
        continue;
      }
      const baseKey=buildingDefs[b.kind].art,base=frames[baseKey],baseWidth=buildingDefs[b.kind].width;
      if(!['field','garden','orchard','lumber','pasture'].includes(b.kind)){
        view.setTexture(this.world.season==='Zima'?snowTexture(this,baseKey):base.sheet,this.world.season==='Zima'?undefined:baseKey).setDisplaySize(baseWidth,baseWidth*base.rect[3]/base.rect[2]);
      }
      view.setAlpha(b.enabled?1:.55);
      const artFrame=frames[buildingDefs[b.kind].art];
      if(b.progress<1){
        const f=artFrame.rect,p=Math.max(.07,b.progress),width=buildingDefs[b.kind].width;
        view.setCrop(0,f[3]*(1-p),f[2],f[3]*p);
        const g=this.effects,x=b.x-width*.5,y=b.y-8,h=width*.65;
        g.lineStyle(5,0x796344,.95).lineBetween(x,y,x,y-h).lineBetween(x+width,y,x+width,y-h).lineBetween(x,y-h*.5,x+width,y-h*.5).lineBetween(x,y-h,x+width,y-h);
        g.lineStyle(2,0xa59567,.7).lineBetween(x,y,x+width,y-h).lineBetween(x+width,y,x,y-h);
        g.fillStyle(0x182018,.9).fillRect(x,y+15,width,6).fillStyle(0xd8bd77).fillRect(x,y+15,width*b.progress,6);
        if(this.world.productionState(b)==='Trwa budowa')for(let i=0;i<5;i++){const t=(this.world.time*1.5+i*.2)%1;g.fillStyle(0xd4b67a,(1-t)*.55).fillCircle(x+width*(i+.5)/5,y-5-t*28,2+t*4)}
      }else{view.setCrop();
        if(recipes[b.kind]&&this.world.productionState(b)==='Produkcja')for(let i=0;i<4;i++){const t=(this.world.time*.25+i*.25)%1;this.effects.fillStyle(0xc7ccc0,(1-t)*.32).fillCircle(b.x+Math.sin(t*5)*8,b.y-artFrame.rect[3]/artFrame.rect[2]*buildingDefs[b.kind].width*.78-t*45,3+t*9)}
      }
      if(['field','garden','pasture'].includes(b.kind))view.setDepth(-10);
      view.setVisible(b.kind!=='pasture');
      if(b.id===this.selectedBuilding)view.setTint(0xffe7ad);else view.clearTint();
      if(['orchard','lumber'].includes(b.kind)){
        const key=this.world.season==='Zima'?'winterTree':this.world.season==='Jesien'?'treeOrange':this.world.season==='Wiosna'?'treeWhite':'apple',f=frames[key],width=buildingDefs[b.kind].width;
        view.setTexture(f.sheet,key).setDisplaySize(width,width*f.rect[3]/f.rect[2]);
      }
      if(b.kind==='garden'){
        const key=this.world.season==='Zima'?'soil':'garden',f=frames[key],width=buildingDefs[b.kind].width;
        view.setTexture(this.world.season==='Zima'?snowTexture(this,key,true):f.sheet,this.world.season==='Zima'?undefined:key).setDisplaySize(width,width*f.rect[3]/f.rect[2]);
        if(b.id!==this.selectedBuilding)view.setTint(this.world.season==='Zima'?0xdbe3df:0xffffff);
      }
      if(b.kind==='field'){
        const winter=this.world.season==='Zima',spring=this.world.season==='Wiosna';
        const key=winter||b.stock<15?'stubble':spring?'field2':'field';
        const f=frames[key],w=buildingDefs.field.width;
        view.setTexture(winter?snowTexture(this,key,true):f.sheet,winter?undefined:key).setDisplaySize(w,w*f.rect[3]/f.rect[2]*(spring?.8:winter?.55:1));
        if(b.id!==this.selectedBuilding)view.setTint(winter?0xdce6e1:spring?0x88b553:0xffffff);
      }
    }
    for(const a of this.world.units){
      let v=this.unitViews.get(a.id);
      if(!v){
        v={sprite:this.art(a.species,a.x,a.y,this.unitWidth(a)),ring:this.add.ellipse(a.x,a.y-2,58,22).setStrokeStyle(2.5,0xf2d877).setDepth(a.y-1),label:this.add.text(a.x,a.y+8,t(a.name),{fontFamily:'Georgia',fontSize:'14px',color:'#fff5d5',stroke:'#20251b',strokeThickness:4}).setOrigin(.5,0),shadow:this.add.ellipse(a.x,a.y-3,40,12,0x151d13,.35)};
        this.unitViews.set(a.id,v);
      }
      const mission=this.world.diplomacy.missions.find(m=>m.unitId===a.id),flying=a.species==='raven'&&(a.path.length>0||!!mission&&mission.phase!=='negotiating');
      const selected=this.selected.includes(a.id),moving=a.path.length>0||flying;
      const f=frames[a.species],w=this.unitWidth(a),scale=w/f.rect[2];
      if(moving){
        const phase=this.reducedMotion?0:Math.floor(a.travel/5)%GAIT_FRAMES;
        v.sprite.setTexture('gait-'+a.species,phase).setDisplaySize((f.rect[2]+48)*scale,(f.rect[3]+48)*scale).setPosition(a.x,a.y+24*scale);
        if(Math.abs(Math.cos(a.heading))>.3)v.sprite.setFlipX(Math.cos(a.heading)<0);
      }else{const key=a.species==='raven'?'ravenPerched':a.species==='pig'&&a.name==='Squealer'?'pigWork':a.species;const rest=frames[key];v.sprite.setTexture(rest.sheet,key).setDisplaySize(w,w*rest.rect[3]/rest.rect[2]).setPosition(a.x,a.y-(a.species==='raven'?18:0))}
      if(a.species==='raven'&&!moving&&!mission&&a.health>0)this.effects.lineStyle(4,0x796044).lineBetween(a.x,a.y,a.x,a.y-18).lineStyle(3,0xb09666).lineBetween(a.x-9,a.y-18,a.x+9,a.y-18);
      const altitude=flying?48+Math.sin((this.reducedMotion?0:this.world.time)*4)*5:0;if(flying)v.sprite.y-=altitude;
      const working=['harvest','wood','stone','build','produce','care','study','govern'].includes(a.task),phase=(this.reducedMotion?0:this.world.time)*5+this.world.units.indexOf(a);
      v.sprite.setRotation(!moving&&working?Math.sin(phase)*.028:0);
      if(!moving&&a.task==='resting')v.sprite.setScale(v.sprite.scaleX,v.sprite.scaleY*(.96+Math.sin(phase*.3)*.015));
      if(working&&a.task==='build')this.effects.lineStyle(2,0xe0c88e,.8).lineBetween(a.x+18,a.y-25,a.x+18+Math.sin(phase)*9,a.y-38);
      v.sprite.setDepth(flying?a.y+600:a.y).setVisible(!mission||mission.phase!=='negotiating').setAlpha(a.health>0?1:.25);
      v.ring.setPosition(a.x,a.y-2).setDepth(a.y-.2).setVisible(selected&&a.health>0);
      v.shadow.setPosition(a.x,a.y-2).setDepth(a.y-.5).setScale(flying?.65:1).setAlpha(flying?.15:.35).setVisible(!mission||mission.phase!=='negotiating');
      v.label.setPosition(a.x,a.y+8).setDepth(a.y+1000).setVisible(selected||a.task==='protesting'||a.task==='refusing');
      if(this.world.wildlife.escaped.includes(a.id)){v.sprite.setVisible(false);v.shadow.setVisible(false);v.ring.setVisible(false);v.label.setVisible(false)}
      v.label.setText(t(a.task==='protesting'?a.name+' / Protest':a.name));
    }
    this.viewCenter={x:c.scrollX+c.width/2,y:c.scrollY+c.height/2};
    this.renderClock+=delta;this.autosaveClock+=delta;
    if(this.renderClock>200){this.onChange();this.renderClock=0}
    if(!this.menuOpen&&this.autosaveSeconds>0&&this.autosaveClock>this.autosaveSeconds*1000){try{saveGame(this.world,'auto')}catch{this.world.notify('Nie udalo sie zapisac automatycznie. Wyeksportuj zapis do pliku.')}this.autosaveClock=0}
  }
  private unitWidth(a:Resident){return ({horse:66,pig:49,dog:53,cow:63,hen:38,sheep:52,raven:42,donkey:58} as Record<string,number>)[a.species]??49}
}
