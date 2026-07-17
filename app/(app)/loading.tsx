const CARD="#FFFFFF",LINE="#E7EBF2",BAR="#EDEFF3";
export default function Loading(){
  const bar=(w:string,h:number)=>({width:w,height:h,background:BAR,borderRadius:6});
  return (<div style={{padding:"40px 40px",maxWidth:820}}>
    <div style={{...bar("200px",28),marginBottom:8}}/>
    <div style={{...bar("300px",16),marginBottom:32}}/>
    {[0,1,2].map(i=>(
      <div key={i} style={{background:CARD,borderRadius:14,padding:20,marginBottom:14,border:`1px solid ${LINE}`,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:42,height:42,borderRadius:11,background:BAR}}/>
        <div style={{flex:1}}>
          <div style={{...bar("180px",15),marginBottom:8}}/>
          <div style={bar("120px",12)}/>
        </div>
      </div>
    ))}
  </div>);
}
