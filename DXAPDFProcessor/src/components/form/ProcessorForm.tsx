"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
const formSchema = z.object({
  studyUUID: z.string().min(1, {
    message: "This is a required field",
  }),
  pdfPath: z.instanceof(FileList),
});

export function ProcessorForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studyUUID: "",
      pdfPath: undefined,
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
  const fileRef = form.register("pdfPath");
  const studies = [
    {
      value: "uuid1",
      label: "UH8870870 WB Whole Body HCH00001",
    },
    {
      value: "uuid2",
      label: "UH8870870 WB Whole Body HCH00002",
    },
    {
      value: "uuid3",
      label: "UH8870870 WB Whole Body HCH00003",
    },
    {
      value: "uuid4",
      label: "UH8870870 WB Whole Body HCH00004",
    },
    {
      value: "uuid5",
      label: "UH8870870 WB Whole Body HCH00005",
    },
  ];
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 grid grid-cols-2 min-h-[100%] w-full mx-auto"
      >
        <FormField
          control={form.control}
          name="studyUUID"
          render={({ field }) => (
            <FormItem className="col-span-1 h-[800px]">
              <FormLabel>Please select study from the list</FormLabel>
              <Popover >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[100%]  h-[800px] ",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? studies.find(
                            (option: any) => option.value === field.value
                          )?.label
                        : "Select a study"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Accession Number/ Patient ID"
                      className="h-9"
                    />
                    <CommandEmpty>No Study found</CommandEmpty>
                    <CommandGroup>
                      {studies.map((option: any) => (
                        <CommandItem
                          value={option.label}
                          key={option.value}
                          onSelect={() => {
                            form.setValue("studyUUID", option.value);
                          }}
                        >
                          {option.label}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              option.value === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pdfPath"
          render={({ field }) => (
            <FormItem className="col-span-1">
              <FormLabel>Click here to upload</FormLabel>
              <FormControl>
                <Input
                  className="h-[800px]"
                  type="file"
                  placeholder="shadcn"
                  {...fileRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="col-span-2">
          Attach PDF to selected study
        </Button>
      </form>
    </Form>
  );
}
