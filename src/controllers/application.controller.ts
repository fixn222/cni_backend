import type { Request, Response } from "express";
import { VisaApplication } from "../models/visaApplication.model.ts";
import { Country } from "../models/country.model.ts";
import {
  sendAdminNewApplicationNotificationEmail,
  sendApplicationConfirmationEmail,
  sendUserMessageToAdminsEmail,
} from "../lib/mailer.ts";
import { User } from "../models/user.model.ts";
import { Activity } from "../models/activity.model.ts";

const normalizeApplicationResponse = (application: any) => ({
  _id: application?._id?.toString?.() ?? application?._id ?? "",
  country: {
    _id: application?.country?._id?.toString?.() ?? application?.country?._id ?? "",
    name: application?.country?.name ?? "Unknown Country",
    code: application?.country?.code ?? "",
  },
  clientDetails: {
    fullName: application?.clientDetails?.fullName ?? "",
    passportNumber: application?.clientDetails?.passportNumber ?? "",
    nationality: application?.clientDetails?.nationality ?? "",
  },
  visaDetails: {
    visaType: application?.visaDetails?.visaType ?? application?.visaDetails?.viaType ?? "",
    travelDate: application?.visaDetails?.travelDate ?? null,
    duration: application?.visaDetails?.duration ?? "",
    purpose: application?.visaDetails?.purpose ?? application?.visaDetails?.travelPurpose ?? "",
    notes: application?.visaDetails?.notes ?? "",
  },
  status: application?.status ?? "pending",
  createdAt: application?.createdAt ?? null,
  updatedAt: application?.updatedAt ?? null,
});

//create an Apllication
export const createApplication = async (req: Request, res: Response) => {
  try {
    const { countryCode, clientDetails, visaDetails } = req.body ?? {};

    if (!countryCode || !clientDetails || !visaDetails) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = (req as any).user;

    const country = await Country.findOne({
      code: countryCode,
    });

    if (!country) {
      return res.status(404).json({
        message: "Country not found",
      });
    }

    const normalizedClientDetails = {
      ...clientDetails,
      dateofBirth: clientDetails.dateofBirth || undefined,
    };

    const normalizedVisaDetails = {
      ...visaDetails,
      purpose:
        visaDetails.purpose ??
        visaDetails.travelPurpose ??
        visaDetails.travelPurposes,
      notes: visaDetails.notes ?? "",
      visaType: visaDetails.visaType ?? visaDetails.viaType,
    };

    const application = await VisaApplication.create({
      user: user.id,
      country: country._id,
      clientDetails: normalizedClientDetails,
      visaDetails: normalizedVisaDetails,
    });

    const populatedApplication = await VisaApplication.findById(application._id)
      .populate("country", "name code")
      .lean();

    // Send confirmation email asynchronously
    sendApplicationConfirmationEmail({
      to: user.email,
      name: user.name,
      countryName: country.name,
      applicationId: application._id.toString(),
    }).catch((error) => {
      console.error("Failed to send application confirmation email:", error);
    });

    const adminUsers = await User.find({ role: "admin" }).lean();
    const adminRecipients = [
      ...new Set(
        [
          ...adminUsers.map((adminUser) => adminUser.email).filter(Boolean),
          process.env.ADMIN_NOTIFICATION_EMAIL,
        ].filter(Boolean),
      ),
    ] as string[];

    await Promise.allSettled(
      adminRecipients.map((recipient) =>
        sendAdminNewApplicationNotificationEmail({
          to: recipient,
          applicantName: normalizedClientDetails.fullName ?? user.name ?? "Unknown applicant",
          countryName: country.name,
          visaType: normalizedVisaDetails.visaType ?? "Unknown visa type",
        }),
      ),
    );

    await Activity.create({
      type: "application_created",
      title: "New application submitted",
      description: `${normalizedClientDetails.fullName ?? user.name ?? "Applicant"} submitted a ${normalizedVisaDetails.visaType ?? "visa"} application for ${country.name}.`,
      application: application._id,
      user: user.id,
      visibility: "shared",
      subject: "New visa application submitted",
      actorName: user.name ?? normalizedClientDetails.fullName ?? null,
      actorEmail: user.email ?? null,
    });

    res.status(201).json({
      application: normalizeApplicationResponse(populatedApplication),
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
  
};

export const getApplicationsByUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const applications = await VisaApplication.find({
      user: user.id,
    })
      .populate("country", "name code")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      applications: applications.map(normalizeApplicationResponse),
    });
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({
      message: e.message,
    });
  }
};

const normalizeUserActivity = (activity: any) => ({
  _id: activity?._id?.toString?.() ?? activity?._id ?? "",
  type: activity?.type ?? "application_created",
  title: activity?.title ?? "",
  description: activity?.description ?? "",
  subject: activity?.subject ?? "",
  actorName: activity?.actorName ?? null,
  actorEmail: activity?.actorEmail ?? null,
  visibility: activity?.visibility ?? "shared",
  applicationId:
    activity?.application?._id?.toString?.() ??
    activity?.application?.toString?.() ??
    "",
  createdAt: activity?.createdAt ?? null,
});

export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const activities = await Activity.find({
      user: user.id,
      visibility: { $in: ["user", "shared"] },
    })
      .populate("application", "_id")
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      activities: activities.map(normalizeUserActivity),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteUserActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const deletedActivity = await Activity.findOneAndDelete({
      _id: id,
      user: user.id,
      visibility: { $in: ["user", "shared"] },
    });

    if (!deletedActivity) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    return res.status(200).json({
      message: "Activity deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const contactAdmin = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { applicationId, subject, message } = req.body ?? {};

    if (!subject || !message) {
      return res.status(400).json({
        message: "Missing message details",
      });
    }

    let application = null;
    if (applicationId) {
      application = await VisaApplication.findOne({
        _id: applicationId,
        user: user.id,
      })
        .populate("country", "name code")
        .lean();
    }

    const adminUsers = await User.find({ role: "admin" }).lean();
    const adminRecipients = [
      ...new Set(
        [
          ...adminUsers.map((adminUser) => adminUser.email).filter(Boolean),
          process.env.ADMIN_NOTIFICATION_EMAIL,
        ].filter(Boolean),
      ),
    ] as string[];

    await sendUserMessageToAdminsEmail({
      recipients: adminRecipients,
      fromName: user.name,
      fromEmail: user.email,
      subject,
      message,
    });

    const activity = await Activity.create({
      type: "support_message",
      title: "Message sent to admin",
      description: message,
      subject,
      application: application?._id ?? null,
      user: user.id,
      visibility: "shared",
      actorName: user.name ?? null,
      actorEmail: user.email ?? null,
    });

    return res.status(201).json({
      activity: normalizeUserActivity(activity),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const { id } = req.params;

    const deletedApplication = await VisaApplication.findOneAndDelete({
      _id: id,
      user: user.id,
    });

    if (!deletedApplication)
      return res.status(404).json({ message: "application not found" });

    res
      .status(200)
      .json({
        message: "Application deleted Successfully",
        deletedApplication,
      });
  } catch (e: any) {
    console.error("message : ", e.message);

    res.status(500).json({ message: e.message });
  }
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const { id } = req.params;

    const updateData: any = {};

    if (req.body.clientDetails) {
      updateData.clientDetails = req.body.clientDetails
    }


    if (req.body.visaDetails) {
      updateData.visaDetails = {
        ...req.body.visaDetails,
        visaType:
          req.body.visaDetails.visaType ?? req.body.visaDetails.viaType,
        purpose:
          req.body.visaDetails.purpose ??
          req.body.visaDetails.travelPurpose,
      }
    }


    const updatedApplication = await VisaApplication.findOneAndUpdate(
      {
        _id: id,
        user: user.id
      },
      {
        $set : updateData
      },
      {
        returnDocument: "after",
        runValidators : true,
      }

    )
      .populate("country", "name code")
      .lean();

    if (!updatedApplication) return res.status(404).json({
      message : "Application not found"
    })

    return res.status(200).json({
      application: normalizeApplicationResponse(updatedApplication),
    });

  } catch (e : any) {

    console.error("message" , e.message);
    return res.status(500).json({message : e.message});
   }
}
