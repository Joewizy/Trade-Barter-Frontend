"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ArrowRight, LoaderCircleIcon } from "lucide-react"
import { useWallet } from "@suiet/wallet-kit"
import { useToast } from "@/hooks/use-toast"
import { createProfile } from "@/lib/calls"
import { useGlobalContext } from "@/context/global-context"

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().nonempty({ message: "Phone number is required." }),
})

const CreateProfileForm = () => {
  const wallet = useWallet()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { setProfileCreated } = useGlobalContext()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: ""
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!wallet.connected) {
      toast({
        title: "Error!",
        description: "Please connect your wallet first!",
        variant: "destructive",
      })
      return;
    }
    setLoading(true);

    let res = await createProfile(data, wallet);
    if (res.result === true) {
      setLoading(false)
      toast({
        title: "Success",
        description: "Profile created successfully!",
      })
      setProfileCreated(true)
    } else {
      setLoading(false)
      toast({
        variant: "destructive",
        title: "Error!",
        description: res.result,
      })
    }
  }

  return (
    <div>
      <p className='text-lg font-bold'>Create Profile</p>
      <p className='mt-2'>To create an order, you need to have a profile created first!</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Username" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Email Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <>Loading <LoaderCircleIcon className="animate-spin" /></> : <>Create Profile <ArrowRight /></>}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateProfileForm