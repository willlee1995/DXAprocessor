"use client";

import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
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
import { setData } from "@/lib/mutations";
import { getDXACase } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  studyUUID: z.string().min(1, {
    message: "This is a required field",
  }),
  pdfPath: z.instanceof(FileList),
});

export function ProcessorForm() {
  const { toast } = useToast();
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

  // 2. Define a submit handler.


  const onValueChange = (value: string) => {
    if (value) {
      const startDate = dayjs()
        .subtract(parseInt(value), "day")
        .format("YYYYMMDD");
      const endDate = dayjs().format("YYYYMMDD");
      setStudyDate(`${startDate}-${endDate}`);
    }
  };
  const { data: fetchedData, isSuccess } = useQuery({
    queryKey: ["DXACases", studyDate],
    queryFn: () => getDXACase(studyDate),
    retry: true,
    refetchOnMount: "always",
    enabled: !!studyDate,
  });
  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      await setData({
        Parent: formData.studyUUID,
        Tags: {
          Modality: "SC",
          ImageType: "DERIVED\\SECONDARY",
          InstanceNumber: "1",
          SeriesDescription: "VFA Report",
          SOPClassUID: "1.2.840.10008.5.1.4.1.1.7",
          ConversionType: "WSD",
          Laterality: "",
        },
        Force: true,
        Content: formData.content,
      });
    },

    onError: async (error: any) => {
      console.log(error);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "VFA report is attached",
      });
    },
  });
  const fileRef = form.register("pdfPath");
  const studies =
    isSuccess &&
    fetchedData.map((item: any) => ({
      value: item.ID,
      label: `${item.PatientMainDicomTags.PatientName} ${item.PatientMainDicomTags.PatientID} ${item.MainDicomTags.AccessionNumber}`,
    }));
  function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.pdfPath[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        const updateValues = { ...values };
        //@ts-ignore
        updateValues.content = base64String;
        mutation.mutate(updateValues);
      };
      reader.readAsDataURL(file);
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 grid grid-cols-2 min-h-[100%] w-full mx-auto"
      >
        {isSuccess && (
          <FormField
            control={form.control}
            name="studyUUID"
            render={({ field }) => (
              <FormItem className="pt-16 space-y-2 col-span-1 h-[800px]">
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
        )}

        <FormField
          control={form.control}
          name="pdfPath"
          render={({ field }) => (
            <FormItem className="space-y-4 col-span-1 h-[700px] py-8">
              <FormLabel className="text-xl">
                Click Below to upload VFA JPG
              </FormLabel>
              <FormControl>
                <Input
                  className="w-full h-[600px] hover:text-accent-foreground hover:bg-accent"
                  type="file"
                  accept=".jpg"
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
