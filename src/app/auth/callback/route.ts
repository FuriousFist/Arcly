 import { NextRequest, NextResponse } from 'next/server'                                                                                                                                                                                                                    
  import { createClient } from '@/lib/supabase/server'
                                                                                                                                                                                                                                                                             
  export async function GET(request: NextRequest) {                                                                                                                                                                                                                          
    const { searchParams, origin } = new URL(request.url)                                                                                                                                                                                                                    
    const code = searchParams.get('code')
                                                                                                                                                                                                                                                                             
    if (!code) {
      return NextResponse.redirect(`${origin}/login`)                                                                                                                                                                                                                        
    }             

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
                                                                                                                                                                                                                                                                             
    if (error) {
      return NextResponse.redirect(`${origin}/login`)                                                                                                                                                                                                                        
    }             

    const { data: { user } } = await supabase.auth.getUser()                                                                                                                                                                                                                 
   
    if (!user) {                                                                                                                                                                                                                                                             
      return NextResponse.redirect(`${origin}/login`)
    }

    const { data: profile } = await supabase                                                                                                                                                                                                                                 
      .from('users')
      .select('onboarding_complete')                                                                                                                                                                                                                                         
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete) {                                                                                                                                                                                                                                     
      return NextResponse.redirect(`${origin}/onboarding`)
    }                                                                                                                                                                                                                                                                        
                  
    return NextResponse.redirect(`${origin}/dashboard`)
  }
