"use client"

import { useEffect, useState } from "react"
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
import { LoaderCircleIcon, Plus } from "lucide-react"
import { useWallet } from '@suiet/wallet-kit'
import { useToast } from "@/hooks/use-toast"
import { callCreateOffer } from "@/lib/calls"
import { useRouter } from "next/navigation";

import { currency_codes, payment_methods } from "@/data/globals"
import CreateProfileForm from "./create-profile-form"
import { useGlobalContext } from "@/context/global-context" 
import { getAllOffers } from "@/lib/calls"

export function CreateOfferDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wallet = useWallet()
  const { toast } = useToast()
  const { profileCreated, setOffers } = useGlobalContext()

  const formSchema = z.object({
    price: z.number().positive({ message: "Must be greater than zero" }),
    amount: z.number().positive({ message: "Must be greater than zero" }),
    currency_code: z.string().nonempty(),
    payment_type: z.string().nonempty(),
  })

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
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!wallet.connected) {
      toast({
        title: "Error!",
        description: "Please connect your wallet first!",
        variant: "destructive",
      })
      return;
    }

    setIsLoading(true);
    let res = await callCreateOffer(values, wallet);

    if (res.result === true) {
      toast({
        title: "Success!",
        description: "Offer has been created",
      });
    
      const latestOffers = await getAllOffers();
      setOffers(latestOffers); 
      setOpen(false);
      setIsLoading(false);
      form.reset();
    }
    setTimeout(() => {
      router.push("/marketplace?tab=sell"); 
    }, 2000);
    
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
        {profileCreated ?
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
                      <FormLabel>Price ({form.watch("currency_code")})</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 3000" {...field} onChange={(event) => field.onChange(Number(event.target.value))} />
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
                        <Input type="number" placeholder="e.g. 300" {...field} onChange={(event) => field.onChange(Number(event.target.value))} />
                      </FormControl>
                      <FormDescription>
                        This is the amount of SUI you want to lock in offer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Offer Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currency_codes.map((item, i) => <SelectItem key={i} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the currency with which you will be receiving payments with.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Payment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Payment Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payment_methods.map((item, i) => <SelectItem key={i} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the method with which you will be receiving payments with.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  disabled={isLoading}
                  variant="outline"
                  type="submit"
                  className="bg-cetus-primary/10 text-cetus-primary border-cetus-primary/30 hover:bg-primary hover:text-black"
                >
                  {isLoading ? <LoaderCircleIcon className="animate-spin" /> : "Publish Offer"}
                </Button>
              </DialogFooter>
            </form>
          </Form> :
          <CreateProfileForm />
        }
      </DialogContent>
    </Dialog >
  )
}
