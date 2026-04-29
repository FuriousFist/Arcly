import { createClient } from '@/lib/supabase/server'
type SupabaseClient = Awaited<ReturnType<typeof createClient>>


const INVITE_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function generateInviteCode(): string {

    const bytes = crypto.getRandomValues(new Uint8Array(8))
    return Array.from(bytes, b => INVITE_CODE_CHARS[b % INVITE_CODE_CHARS.length]).join('')
}

async function isCodeTaken(supabase: SupabaseClient, code: string): Promise<boolean> {

    const { data: classID } = await supabase.from('classes')
                                            .select('id')
                                            .eq('invite_code', code)
    
    return classID != null && classID.length > 0
}

export async function generateUniqueInviteCode(supabase: SupabaseClient): Promise<string> {

    while(true) {

        const inviteCode = generateInviteCode()

        if (!await isCodeTaken(supabase, inviteCode)) {
            return inviteCode
        }
    }
}
