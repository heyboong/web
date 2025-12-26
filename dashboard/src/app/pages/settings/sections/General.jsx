// Import Dependencies
import { PhoneIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { HiPencil } from "react-icons/hi";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from 'yup';

// Local Imports
import { PreviewImg } from "components/shared/PreviewImg";
import { Avatar, Button, Input, Upload, InputErrorMsg } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { getAvatarProps } from "utils/avatar";

// ----------------------------------------------------------------------

const schema = Yup.object().shape({
  first_name: Yup.string()
    .trim()
    .max(50, 'First name must be less than 50 characters')
    .nullable(),
  last_name: Yup.string()
    .trim()
    .max(50, 'Last name must be less than 50 characters')
    .nullable(),
  phone: Yup.string()
    .trim()
    .matches(/^[0-9]+$/, 'Phone number must contain only digits')
    .max(20, 'Phone number must be no more than 20 characters')
    .nullable(),
  bio: Yup.string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .nullable(),
});

export default function General() {
  const { user, updateProfile, updateAvatar, isUpdatingProfile, profileError } = useAuthContext();
  const [avatar, setAvatar] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty: formIsDirty },
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      bio: '',
    },
  });

  // Watch form changes (for future use if needed)
  // const watchedValues = watch();

  // Load user data into form
  useEffect(() => {
    if (user) {
      setValue('first_name', user.first_name || '');
      setValue('last_name', user.last_name || '');
      setValue('phone', user.phone || '');
      setValue('bio', user.bio || '');
    }
  }, [user, setValue]);

  // Check if form is dirty
  useEffect(() => {
    setIsDirty(formIsDirty);
  }, [formIsDirty]);

  const onSubmit = async (data) => {
    // Filter out empty strings and convert to null
    const updateData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value && value.trim() !== '' ? value.trim() : null
      ])
    );

    const result = await updateProfile(updateData);
    
    if (result.success) {
      // Reset form dirty state
      reset(data);
      setIsDirty(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
    setIsDirty(false);
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatar(file); // Set preview

    try {
      const result = await updateAvatar(file);
      
      if (result.success) {
        // Avatar updated successfully in context
        console.log('Avatar uploaded successfully');
        // Clear the preview since the context now has the updated user
        setAvatar(null);
      } else {
        // Reset preview on error
        setAvatar(null);
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatar(null); // Reset preview on error
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = () => {
    setAvatar(null);
    // You could add an API call here to remove avatar from database
    // For now, we'll just clear the preview
  };

  return (
    <div className="w-full max-w-3xl 2xl:max-w-5xl">
      <h5 className="text-lg font-medium text-gray-800 dark:text-dark-50">
        General
      </h5>
      <p className="mt-0.5 text-balance text-sm text-gray-500 dark:text-dark-200">
        Update your account settings.
      </p>
      <div className="my-5 h-px bg-gray-200 dark:bg-dark-500" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-4 flex flex-col space-y-1.5">
          <span className="text-base font-medium text-gray-800 dark:text-dark-100">
            Avatar
          </span>
          <Avatar
            size={20}
            imgComponent={PreviewImg}
            imgProps={{ file: avatar }}
            {...getAvatarProps(user?.avatar, user?.username)}
            classNames={{
              root: "rounded-xl ring-primary-600 ring-offset-[3px] ring-offset-white transition-all hover:ring-3 dark:ring-primary-500 dark:ring-offset-dark-700",
              display: "rounded-xl",
            }}
            indicator={
              <div className="absolute bottom-0 right-0 -m-1 flex items-center justify-center rounded-full bg-white dark:bg-dark-700">
                {isUploadingAvatar ? (
                  <Button
                    isIcon
                    className="size-6 rounded-full"
                    disabled
                  >
                    <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
                  </Button>
                ) : avatar ? (
                  <Button
                    onClick={handleAvatarRemove}
                    isIcon
                    className="size-6 rounded-full"
                  >
                    <XMarkIcon className="size-4" />
                  </Button>
                ) : (
                  <Upload name="avatar" onChange={handleAvatarUpload} accept="image/*">
                    {({ ...props }) => (
                      <Button isIcon className="size-6 rounded-full" {...props}>
                        <HiPencil className="size-3.5" />
                      </Button>
                    )}
                  </Upload>
                )}
              </div>
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 [&_.prefix]:pointer-events-none">
          <Input
            placeholder="Enter First Name"
            label="First Name"
            className="rounded-xl"
            prefix={<UserIcon className="size-4.5" />}
            {...register("first_name")}
            error={errors?.first_name?.message}
          />
          <Input
            placeholder="Enter Last Name"
            label="Last Name"
            className="rounded-xl"
            prefix={<UserIcon className="size-4.5" />}
            {...register("last_name")}
            error={errors?.last_name?.message}
          />
          <Input
            placeholder={user?.email || "Enter Email"}
            label="Email"
            className="rounded-xl"
            prefix={<EnvelopeIcon className="size-4.5" />}
            disabled
            value={user?.email || ''}
          />
          <Input
            placeholder="Enter phone number"
            label="Phone Number"
            className="rounded-xl"
            prefix={<PhoneIcon className="size-4.5" />}
            {...register("phone")}
            error={errors?.phone?.message}
          />
        </div>

        <div className="mt-5">
          <Input
            placeholder="Tell us about yourself..."
            label="Bio"
            className="rounded-xl"
            prefix={<UserIcon className="size-4.5" />}
            {...register("bio")}
            error={errors?.bio?.message}
          />
        </div>

        {profileError && (
          <div className="mt-4">
            <InputErrorMsg text={profileError} />
          </div>
        )}
      <div className="my-7 h-px bg-gray-200 dark:bg-dark-500" />
      <div>
        <div>
          <p className="text-base font-medium text-gray-800 dark:text-dark-100">
            Linked Accounts
          </p>
          <p className="mt-0.5">
            Manage your linked accounts and their permissions.
          </p>
        </div>
        <div>
          <div className="mt-4 flex items-center justify-between space-x-2 ">
            <div className="flex min-w-0 items-center space-x-4 ">
              <div className="size-12">
                <img
                  className="h-full w-full"
                  src="/images/logos/google.svg"
                  alt="logo"
                />
              </div>
              <p className="truncate font-medium">Sign In with Google</p>
            </div>
            <Button
              className="h-8 rounded-full px-3 text-xs-plus"
              variant="outlined"
            >
              Connect
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between space-x-2 ">
            <div className="flex min-w-0 items-center space-x-4 ">
              <div className="size-12">
                <img
                  className="h-full w-full"
                  src="/images/logos/github-round.svg"
                  alt="logo"
                />
              </div>
              <p className="truncate font-medium">Sign In with Github</p>
            </div>
            <Button
              className="h-8 rounded-full px-3 text-xs-plus"
              variant="outlined"
            >
              Connect
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between space-x-2 ">
            <div className="flex min-w-0 items-center space-x-4 ">
              <div className="size-12">
                <img
                  className="h-full w-full"
                  src="/images/logos/instagram-round.svg"
                  alt="logo"
                />
              </div>
              <p className="truncate font-medium">Sign In with Instagram</p>
            </div>
            <Button
              className="h-8 rounded-full px-3 text-xs-plus"
              variant="outlined"
            >
              Connect
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between space-x-2 ">
            <div className="flex min-w-0 items-center space-x-4 ">
              <div className="size-12">
                <img
                  className="h-full w-full"
                  src="/images/logos/discord-round.svg"
                  alt="logo"
                />
              </div>
              <p className="truncate font-medium">Sign In with Discord</p>
            </div>
            <Button
              className="h-8 rounded-full px-3 text-xs-plus"
              variant="outlined"
            >
              {" "}
              Connect
            </Button>
          </div>
        </div>
      </div>
        <div className="mt-8 flex justify-end space-x-3">
          <Button 
            type="button"
            className="min-w-[7rem]"
            onClick={handleCancel}
            disabled={!isDirty || isUpdatingProfile}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="min-w-[7rem]" 
            color="primary"
            loading={isUpdatingProfile}
            disabled={!isDirty || isUpdatingProfile}
          >
            {isUpdatingProfile ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
