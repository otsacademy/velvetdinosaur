import Image from "next/image"
import { OTPForm } from "@/registry/new-york-v4/blocks/otp-02/components/otp-form"

export default function OTPPage() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-xs">
          <OTPForm />
        </div>
      </div>
      <div className="relative hidden w-1/2 lg:block">
        <Image
          alt="Authentication"
          className="object-cover"
          fill
          src="/placeholder.svg"
        />
      </div>
    </div>
  )
}
