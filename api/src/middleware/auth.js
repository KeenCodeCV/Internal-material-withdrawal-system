const { verify } = require('../utils/jwt');
module.exports = function(required=true){
  return (req,res,next)=>{
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : (req.cookies?.token || null);
    if(!token){ if(!required) return next(); return res.status(401).json({ message:'Unauthorized' }); }
    try{ req.user = verify(token); next(); }catch(e){ return res.status(401).json({ message:'Invalid token' }); }
  }
}