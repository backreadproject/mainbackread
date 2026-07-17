const INK="#0B1220",SLATE="#64748B",CARD="#FFFFFF",AEON="'Moderat', 'Inter', sans-serif";
const SHADOW="0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";
export default function SettingsPage(){
  return (<div style={{fontFamily:AEON,color:INK,minHeight:"100vh"}}>
    <main style={{maxWidth:820,padding:"40px 40px"}}>
      <h1 style={{fontSize:26,fontWeight:400,letterSpacing:"-0.015em",margin:"0 0 24px"}}>Settings</h1>
      <div style={{background:CARD,borderRadius:14,padding:32,boxShadow:SHADOW}}>
        <p style={{fontSize:15,color:SLATE,margin:0,lineHeight:1.6}}>Settings tools are coming in the next build.</p>
      </div>
    </main>
  </div>);
}
