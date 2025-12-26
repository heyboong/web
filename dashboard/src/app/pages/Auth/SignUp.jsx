// Import Dependencies
import { Link } from "react-router";
import { EnvelopeIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as Yup from 'yup';

// Local Imports
import Logo from "assets/appLogo.svg?react";
import { Button, Card, Checkbox, Input, InputErrorMsg } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

const schema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SignUp() {
  const { signup, errorMessage, isLoading } = useAuthContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (data) => {
    signup({
      username: data.username,
      email: data.email,
      password: data.password,
      confirm_password: data.confirm_password,
    });
  };

  return (
    <Page title="Sign Up">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-dark-100">
                Create Account
              </h2>
              <p className="text-gray-400 dark:text-dark-300">
                Sign up to get started
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="space-y-4">
              <Input
                label="Username"
                placeholder="Enter username"
                prefix={
                  <UserIcon
                    className="size-5 transition-colors duration-200"
                    strokeWidth="1"
                  />
                }
                {...register("username")}
                error={errors?.username?.message}
              />
              <Input
                label="Email"
                placeholder="Enter email"
                type="email"
                prefix={
                  <EnvelopeIcon
                    className="size-5 transition-colors duration-200"
                    strokeWidth="1"
                  />
                }
                {...register("email")}
                error={errors?.email?.message}
              />
              <Input
                label="Password"
                placeholder="Enter password"
                type="password"
                prefix={
                  <LockClosedIcon
                    className="size-5 transition-colors duration-200"
                    strokeWidth="1"
                  />
                }
                {...register("password")}
                error={errors?.password?.message}
              />
              <Input
                label="Confirm Password"
                placeholder="Confirm password"
                type="password"
                prefix={
                  <LockClosedIcon
                    className="size-5 transition-colors duration-200"
                    strokeWidth="1"
                  />
                }
                {...register("confirm_password")}
                error={errors?.confirm_password?.message}
              />
            </div>

            {errorMessage && (
              <div className="mt-4">
                <InputErrorMsg text={errorMessage} />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between space-x-2">
              <Checkbox label="I agree to the terms and conditions" />
              <a
                href="##"
                className="text-xs text-gray-400 transition-colors hover:text-gray-800 focus:text-gray-800 dark:text-dark-300 dark:hover:text-dark-100 dark:focus:text-dark-100"
              >
                Terms & Privacy
              </a>
            </div>

            <Button
              type="submit"
              className="mt-5 w-full"
              color="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs-plus">
            <p className="line-clamp-1">
              <span>Already have an account?</span>{" "}
              <Link
                className="text-primary-600 transition-colors hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600"
                to="/login"
              >
                Sign In
              </Link>
            </p>
          </div>
          <div className="my-7 flex items-center space-x-3 text-xs ">
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-500"></div>
            <p>OR</p>
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-500"></div>
          </div>
          <div className="flex gap-4">
            <Button className="h-10 flex-1 gap-3" variant="outlined">
              <img
                className="size-5.5"
                src="/images/logos/google.svg"
                alt="logo"
              />
              <span>Google</span>
            </Button>
            <Button className="h-10 flex-1 gap-3" variant="outlined">
              <img
                className="size-5.5"
                src="/images/logos/github.svg"
                alt="logo"
              />
              <span>Github</span>
            </Button>
          </div>
        </Card>
        <div className="mt-8 flex justify-center text-xs text-gray-400 dark:text-dark-300">
          <a href="##">Privacy Notice</a>
          <div className="mx-2.5 my-0.5 w-px bg-gray-200 dark:bg-dark-500"></div>
          <a href="##">Term of service</a>
        </div>
        </div>
      </main>
    </Page>
  );
}
