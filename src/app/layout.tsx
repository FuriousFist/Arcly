import type { Metadata } from "next"                                                                                                                                                                                                                                       
  import { DM_Sans } from "next/font/google"                                                                                                                                                                                                                                 
  import "./globals.css"
                                                                                                                                                                                                                                                                             
  const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
  })
                                                                                                                                                                                                                                                                             
  export const metadata: Metadata = {
    title: "Arcly",                                                                                                                                                                                                                                                          
    description: "AI-powered teaching platform",
  }

  export default function RootLayout({
    children,
  }: Readonly<{                                                                                                                                                                                                                                                              
    children: React.ReactNode
  }>) {                                                                                                                                                                                                                                                                      
    return (      
      <html lang="en" className={`${dmSans.variable} h-full`}>
        <body className="min-h-full flex flex-col font-sans">{children}</body>                                                                                                                                                                                               
      </html>
    )                                                                                                                                                                                                                                                                        
  }               
