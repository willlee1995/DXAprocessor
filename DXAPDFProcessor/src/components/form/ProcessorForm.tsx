"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  const [studyDate, setStudyDate] = useState("");
  useEffect(() => {
    console.log(studyDate);
  }, [studyDate]);
  const { data: fetchedData } = useQuery({
    queryKey: ["VettingFormById"],
    queryFn: async () => {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa("admin:admin")}`,
      };
      const res = await fetch("http://localhost/tools/find", {
        method: "POST",
        headers,
        body: JSON.stringify({
          Level: "Study",
          Query: {
            PatientName: "*",
            StudyDate: studyDate,
          },
          Expand: true,
        }),
      });
      const json = await res.json();
      if (json.errors) {
        for (let error in json.errors) {
          console.error(error);
        }
      }
      return json;
    },
  });
  console.log(fetchedData);
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values.pdfPath);
    const file = values.pdfPath[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result;

        console.log(base64String); // Use the Base64 string as needed
      };

      reader.readAsDataURL(file);
    }
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
  const onValueChange = (value: string) => {
    if (value) {
      const startDate = dayjs()
        .subtract(parseInt(value), "day")
        .format("YYYYMMDD");
      const endDate = dayjs().format("YYYYMMDD");
      setStudyDate(`${startDate}-${endDate}`);
    }
  };
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
            <FormItem className="pt-16 space-y-4 col-span-1 h-[700px] pb-8">
              <FormLabel className="text-xl">
                Please select study from the list
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[100%]  h-[600px]",
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
                <PopoverContent
                  avoidCollisions={false}
                  sideOffset={-400}
                  side="bottom"
                  className="w-[400px] p-0"
                >
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
            <FormItem className="space-y-4 col-span-1 h-[700px] py-8">
              <FormLabel className="text-xl">
                Click Below to upload VFA PDF
              </FormLabel>
              <FormControl>
                <Input
                  className="w-full h-[600px] hover:text-accent-foreground hover:bg-accent"
                  type="file"
                  {...fileRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator className="col-span-2" />
        <FormItem className="">
          <FormLabel className="text-left mx-0">
            Select Study Time Filter if needed
          </FormLabel>
          <Select onValueChange={onValueChange} defaultValue="0">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Study Time Filter Selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Today</SelectItem>
              <SelectItem value="7">Last Week</SelectItem>
              <SelectItem value="14">Last Two Weeks</SelectItem>
              <SelectItem value="60">Last Two Months</SelectItem>
              <SelectItem value="*">Unlimited</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
        <Button type="submit" className="col-span-2">
          Attach JPG to selected study
        </Button>
      </form>
    </Form>
  );
}
