import { User } from "../models/user.model.ts";

type SessionUserLike = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified?: boolean;
};

export const getUserRecordBySessionUser = async (sessionUser: SessionUserLike) => {
  if (!sessionUser?.email) {
    return null;
  }

  const userRecord = await User.findOne({ email: sessionUser.email }).lean();

  if (userRecord && !userRecord.role) {
    await User.updateOne({ _id: userRecord._id }, { $set: { role: "user" } });
    return {
      ...userRecord,
      role: "user" as const,
    };
  }

  return userRecord;
};

export const buildSessionUser = async (sessionUser: SessionUserLike | null) => {
  if (!sessionUser) {
    return null;
  }

  const userRecord = await getUserRecordBySessionUser(sessionUser);

  return {
    ...sessionUser,
    role: userRecord?.role ?? "user",
  };
};
