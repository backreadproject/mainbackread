const INK="#1A1D21",GRAPHITE="#8A8778",RULE="#E4E2DB",AEON="'Aeonik', Arial, sans-serif";
export default function SettingsPage(){
  return (<div style={{fontFamily:AEON,color:INK}}>
    <header style={{borderBottom:`1px solid ${RULE}`,padding:"22px 40px"}}>
      <h1 style={{fontWeight:500,fontSize:26,letterSpacing:"-0.01em",margin:0}}>Settings</h1>
    </header>
    <main style={{maxWidth:780,padding:"32px 40px"}}>
      <p style={{fontSize:16,color:GRAPHITE}}>Workspace name, defaults, and preferences. Coming in the next build.</p>
    </main>
  </div>);
}
