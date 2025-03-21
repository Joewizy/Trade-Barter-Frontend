"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { useWallet } from '@suiet/wallet-kit'
import callCreateOffer from "@/lib/calls"

const formSchema = z.object({
  price: z.number().positive({ message: "Must be greater than zero" }),
  amount: z.number().positive({ message: "Must be greater than zero" }),
  currency_code: z.string().nonempty(),
  payment_type: z.string().nonempty(),
})

export function CreateOfferDialog() {
  const [open, setOpen] = useState(false)
  const wallet = useWallet()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: 0,
      amount: 0,
      currency_code: "NGN",
      payment_type: "Bank Transfer"
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!wallet.connected) return;
    // Do something with the form values.
    callCreateOffer(amount, 'NGN', wallet);

    // Close the dialog
    setOpen(false)

    // Reset form
    // ✅ This will be type-safe and validated.
    console.log(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cetus-primary/10 text-cetus-primary border-cetus-primary/30 hover:text-black">
          <Plus className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
              <DialogDescription>Set up your offer details. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>Price ({form.getValues("currency_code")})</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 3000" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the rate you want to sell your sui for the selected currency.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>Amount (SUI)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 300" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the amount of SUI you want to lock.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>Amount (SUI)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 300" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the amount of SUI you want to lock.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>Amount (SUI)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 300" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the amount of SUI you want to lock.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />




            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="submit"
                className="bg-cetus-primary/10 text-cetus-primary border-cetus-primary/30"
              >
                Publish Offer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog >
  )
}

