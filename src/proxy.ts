import { NextRequest, NextResponse } from 'next/server'                                                                                                                                                                                                                    
  import { createServerClient } from '@supabase/ssr'

  const protectedRoutes = ['/dashboard', '/onboarding']                                                                                                                                                                                                                      
  const publicRoutes = ['/login']
                                                                                                                                                                                                                                                                             
  export async function proxy(request: NextRequest) {                                                                                                                                                                                                                   
    const response = NextResponse.next({
      request: { headers: request.headers },                                                                                                                                                                                                                                 
    })            

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,                                                                                                                                                                                                                            
      {
        cookies: {                                                                                                                                                                                                                                                           
          getAll() {
            return request.cookies.getAll()
          },                                                                                                                                                                                                                                                                 
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>                                                                                                                                                                                                               
              response.cookies.set(name, value, options)
            )
          },                                                                                                                                                                                                                                                                 
        },
      }                                                                                                                                                                                                                                                                      
    )             

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname                                                                                                                                                                                                                                    
    const isProtectedRoute = protectedRoutes.some(r => path.startsWith(r))
    const isPublicRoute = publicRoutes.includes(path)                                                                                                                                                                                                                        
                  
    if (isProtectedRoute && !user) {                                                                                                                                                                                                                                         
      return NextResponse.redirect(new URL('/login', request.nextUrl))
    }                                                                                                                                                                                                                                                                        
                  
    if (isPublicRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
    }                                                                                                                                                                                                                                                                        
  
    return response                                                                                                                                                                                                                                                          
  }               

  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$|.*\\.png$).*)'],
  }