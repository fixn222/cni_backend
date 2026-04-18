import type { Request, Response } from "express";

import { Activity } from "../models/activity.model.ts";
import { Country } from "../models/country.model.ts";
import { User } from "../models/user.model.ts";
import { VisaApplication } from "../models/visaApplication.model.ts";
import {
  sendAdminClientEmail,
  sendApplicationStatusUpdateEmail,
} from "../lib/mailer.ts";

const normalizeAdminApplication = (application: any) => ({
  _id: application?._id?.toString?.() ?? application?._id ?? "",
  user: {
    id: application?.user?._id?.toString?.() ?? application?.user?._id ?? "",
    name: application?.user?.name ?? "Unknown User",
    email: application?.user?.email ?? "",
  },
  country: {
    name: application?.country?.name ?? "Unknown Country",
    code: application?.country?.code ?? "",
    flag: application?.country?.flag ?? "",
  },
  clientDetails: {
    fullName: application?.clientDetails?.fullName ?? "",
    passportNumber: application?.clientDetails?.passportNumber ?? "",
    nationality: application?.clientDetails?.nationality ?? "",
  },
  visaDetails: {
    visaType:
      application?.visaDetails?.visaType ??
      application?.visaDetails?.viaType ??
      "",
    purpose:
      application?.visaDetails?.purpose ??
      application?.visaDetails?.travelPurpose ??
      "",
    travelDate: application?.visaDetails?.travelDate ?? null,
    duration: application?.visaDetails?.duration ?? "",
    notes: application?.visaDetails?.notes ?? "",
  },
  status: application?.status ?? "pending",
  createdAt: application?.createdAt ?? null,
});

const normalizeActivity = (activity: any) => ({
  _id: activity?._id?.toString?.() ?? activity?._id ?? "",
  type: activity?.type ?? "application_created",
  title: activity?.title ?? "",
  description: activity?.description ?? "",
  actorName: activity?.actorName ?? null,
  actorEmail: activity?.actorEmail ?? null,
  subject: activity?.subject ?? "",
  visibility: activity?.visibility ?? "shared",
  applicationId:
    activity?.application?._id?.toString?.() ??
    activity?.application?.toString?.() ??
    "",
  userId:
    activity?.user?._id?.toString?.() ??
    activity?.user?.toString?.() ??
    "",
  createdAt: activity?.createdAt ?? null,
});

const normalizeUser = (user: any) => ({
  id: user?._id?.toString?.() ?? user?._id ?? "",
  name: user?.name ?? "Unknown User",
  email: user?.email ?? "",
  role: user?.role ?? "user",
  emailVerified: Boolean(user?.emailVerified),
  createdAt: user?.createdAt ?? null,
});

const normalizeCountry = (country: any) => ({
  id: country?._id?.toString?.() ?? country?._id ?? "",
  code: country?.code ?? "",
  name: country?.name ?? "",
  visaType: country?.visaType ?? [],
  image: country?.image ?? "",
  flag: country?.flag ?? "",
  popular: Boolean(country?.popular),
  selected: Boolean(country?.selected),
  createdAt: country?.createdAt ?? null,
});

export const getAdminApplications = async (_req: Request, res: Response) => {
  try {
    const [applications, activities, users, countries] = await Promise.all([
      VisaApplication.find()
        .populate("country", "name code flag")
        .populate("user", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .lean(),
      Activity.find()
        .or([{ visibility: "admin" }, { visibility: "shared" }])
        .sort({ createdAt: -1, _id: -1 })
        .limit(50)
        .populate("application", "_id")
        .populate("user", "_id")
        .lean(),
      User.find().sort({ createdAt: -1, _id: -1 }).lean(),
      Country.find().sort({ name: 1, _id: 1 }).lean(),
    ]);

    return res.status(200).json({
      applications: applications.map(normalizeAdminApplication),
      activities: activities.map(normalizeActivity),
      users: users.map(normalizeUser),
      countries: countries.map(normalizeCountry),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch admin applications",
    });
  }
};

export const deleteAdminApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedApplication = await VisaApplication.findByIdAndDelete(id).lean();

    if (!deletedApplication) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    await Activity.deleteMany({ application: id });

    return res.status(200).json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete application",
    });
  }
};

export const createAdminCountry = async (req: Request, res: Response) => {
  try {
    const { code, name, visaType, image, flag, popular, selected } = req.body ?? {};

    if (!code || !name || !image || !flag || !Array.isArray(visaType) || visaType.length === 0) {
      return res.status(400).json({
        message: "Missing country fields",
      });
    }

    const country = await Country.create({
      code,
      name,
      visaType,
      image,
      flag,
      popular: Boolean(popular),
      selected: Boolean(selected),
    });

    return res.status(201).json({
      country: normalizeCountry(country),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to create destination",
    });
  }
};

export const deleteAdminCountry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingApplications = await VisaApplication.exists({ country: id });
    if (existingApplications) {
      return res.status(400).json({
        message: "Cannot delete a destination that is used by applications",
      });
    }

    const deletedCountry = await Country.findByIdAndDelete(id).lean();

    if (!deletedCountry) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    return res.status(200).json({
      message: "Destination deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete destination",
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: normalizeUser(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to update user role",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user;

    if (adminUser?.id === id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id).lean();

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const deletedApplications = await VisaApplication.find({ user: id }).select("_id").lean();
    const applicationIds = deletedApplications.map((application) => application._id);

    await Promise.all([
      VisaApplication.deleteMany({ user: id }),
      Activity.deleteMany({
        $or: [{ user: id }, { application: { $in: applicationIds } }],
      }),
    ]);

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete user",
    });
  }
};

export const updateAdminApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const adminUser = (req as any).user;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const application = await VisaApplication.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .populate("country", "name code flag")
      .populate("user", "name email")
      .lean();

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    await Activity.create({
      type: "status_updated",
      title: "Application status updated",
      description: `${application.clientDetails?.fullName ?? "Applicant"} was marked as ${status}.`,
      application: application._id,
      user: application.user?._id ?? null,
      visibility: "shared",
      subject: `Application status changed to ${status}`,
      actorName: adminUser?.name ?? "Admin",
      actorEmail: adminUser?.email ?? null,
    });

    if (application.user?.email) {
      await sendApplicationStatusUpdateEmail({
        to: application.user.email,
        name: application.user.name,
        status,
        countryName: application.country?.name ?? "your destination",
      });
    }

    return res.status(200).json({
      application: normalizeAdminApplication(application),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to update application status",
    });
  }
};

export const sendApplicationEmail = async (req: Request, res: Response) => {
  try {
    const { applicationId, subject, message } = req.body ?? {};
    const adminUser = (req as any).user;

    if (!applicationId || !subject || !message) {
      return res.status(400).json({
        message: "Missing email fields",
      });
    }

    const application = await VisaApplication.findById(applicationId)
      .populate("country", "name code flag")
      .populate("user", "name email")
      .lean();

    if (!application?.user?.email) {
      return res.status(404).json({
        message: "Application or user email not found",
      });
    }

    await sendAdminClientEmail({
      to: application.user.email,
      subject,
      message,
    });

    await Activity.create({
      type: "email_sent",
      title: "Email sent to client",
      description: message,
      application: application._id,
      user: application.user?._id ?? null,
      visibility: "shared",
      subject,
      actorName: adminUser?.name ?? "Admin",
      actorEmail: adminUser?.email ?? null,
    });

    return res.status(200).json({
      message: "Email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to send email",
    });
  }
};

export const deleteAdminActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedActivity = await Activity.findOneAndDelete({
      _id: id,
      visibility: { $in: ["admin", "shared"] },
    });

    if (!deletedActivity) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    return res.status(200).json({
      message: "Activity deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete activity",
    });
  }
};
