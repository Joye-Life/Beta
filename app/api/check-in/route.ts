import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const now=new Date().toISOString();
  await supabase.from("profiles").update({last_check_in_at:now,updated_at:now}).eq("id",user.id);
  await supabase.from("joye_memory").insert({user_id:user.id,memory_type:"check_in",content:{event:"check_in",note:"User completed a Joye Life check-in."},importance:2});
  return NextResponse.json({ok:true,checkedInAt:now});
}
