'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitProofUrl } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, UploadCloud } from 'lucide-react'

export function ProofUploadForm({ winnerId }: { winnerId: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('proofData') as File

    if (!file || file.size === 0) {
      toast.error('Please select a file to upload.')
      setLoading(false)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Authentication error.')
      setLoading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${winnerId}-${Date.now()}.${fileExt}`

    const { error: uploadError, data } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, file)

    if (uploadError) {
      console.error(uploadError)
      toast.error('Failed to upload file to storage.')
      setLoading(false)
      return
    }

    // Get public URL or construct path
    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(fileName)

    const result = await submitProofUrl(winnerId, publicUrl || data.path)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Proof submitted! Awaiting admin approval.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 space-y-2 w-full">
        <Label htmlFor={`proof-${winnerId}`}>Upload Proof (PNG/JPG/PDF)</Label>
        <Input 
          id={`proof-${winnerId}`}
          name="proofData" 
          type="file" 
          accept=".png,.jpg,.jpeg,.pdf" 
          className="cursor-pointer"
          required 
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
        Submit
      </Button>
    </form>
  )
}
