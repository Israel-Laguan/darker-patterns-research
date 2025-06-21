import { PasswordInput } from '@/components/auth/PasswordInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Control, ControllerRenderProps, UseFormReturn } from 'react-hook-form';
import type { SignupFormValues } from '@/lib/validations/signup';

interface SignupFormFieldsProps {
  form: UseFormReturn<SignupFormValues>;
  onSubmit: (data: SignupFormValues) => Promise<void>;
}

const inputClassName = cn(
  'dark:bg-dark-bg-secondary dark:border-dark-border dark:text-dark-text-primary',
  'focus:ring-2 focus:ring-brand-purple-500 dark:focus:ring-brand-purple-400',
  'transition-colors duration-200',
  'w-full',
);

// Form field styling constants
const FORM_FIELD_CLASS = 'w-full';

interface TextFieldProps {
  control: Control<SignupFormValues>;
  name: keyof Omit<SignupFormValues, 'isResearcher'>;
  label: string;
  placeholder: string;
  type?: string;
}

const TextField = ({ control, name, label, placeholder, type = 'text' }: TextFieldProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="dark:text-dark-text-primary">{label}</FormLabel>
        <FormControl>
          <Input type={type} placeholder={placeholder} className={inputClassName} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const PasswordField = ({ control }: { control: Control<SignupFormValues> }) => (
  <FormField
    control={control}
    name="password"
    render={({ field }) => (
      <FormItem className={FORM_FIELD_CLASS}>
        <FormLabel className="dark:text-dark-text-primary">Password</FormLabel>
        <PasswordInput field={field} className={inputClassName} />
        <FormMessage />
      </FormItem>
    )}
  />
);

const ResearcherCheckbox = ({ control }: { control: Control<SignupFormValues> }) => {
  // Create a custom checkbox handler to handle the boolean value correctly
  const handleCheckboxChange = (
    checked: boolean | string,
    field: ControllerRenderProps<SignupFormValues, 'isResearcher'>,
  ) => {
    field.onChange(checked === true);
  };

  return (
    <FormField
      control={control}
      name="isResearcher"
      render={({ field }) => (
        <FormItem className={cn('flex flex-row items-start space-y-0 space-x-3', FORM_FIELD_CLASS)}>
          <FormControl>
            <Checkbox
              checked={field.value as boolean}
              onCheckedChange={(checked) => handleCheckboxChange(checked, field)}
              className={cn(
                'border-light-border-primary text-brand-purple-600 mt-0.5',
                'focus:ring-brand-purple-500 dark:focus:ring-brand-purple-400',
                'dark:border-dark-border dark:bg-dark-bg-secondary',
                'transition-colors duration-200',
              )}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="dark:text-dark-text-primary">I am a researcher</FormLabel>
          </div>
        </FormItem>
      )}
    />
  );
};

export function SignupFormFields({ form, onSubmit }: SignupFormFieldsProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TextField
          control={form.control}
          name="displayName"
          label="Display Name"
          placeholder="Enter your display name"
        />

        <TextField control={form.control} name="email" label="Email" type="email" placeholder="Enter your email" />

        <PasswordField control={form.control} />
        <ResearcherCheckbox control={form.control} />
      </form>
    </Form>
  );
}
