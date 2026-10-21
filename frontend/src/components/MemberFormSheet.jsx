import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  PLAN_CODES,
  PLAN_LABELS,
  calcExpiry,
  planAmount,
  planIndex,
  today,
} from "../lib/memberUtils";
import { saveMember } from "../store/membersSlice";

export default function MemberFormSheet({ memberId, onClose }) {
  const dispatch = useDispatch();
  const existing = useSelector((s) =>
    s.members.list.find((m) => m.id === memberId),
  );
  const editing = Boolean(existing);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: existing
      ? {
          name: existing.name,
          phone: existing.phone,
          address: existing.address || "",
          join: existing.join,
          plan: PLAN_CODES[planIndex(existing.plan)],
        }
      : {
          name: "",
          phone: "",
          address: "",
          join: today(),
          plan: PLAN_CODES[0],
        },
  });

  const join = watch("join");
  const plan = watch("plan");

  const onSubmit = async (values) => {
    const member = {
      id: existing?.id || "",
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      join: values.join,
      expiry: calcExpiry(values.join, values.plan),
      plan: values.plan,
      amount: planAmount(values.plan),
      paid: existing?.paid ?? true,
    };
    try {
      const result = await dispatch(saveMember({ member, editing })).unwrap();
      toast.success(
        result.editing
          ? `${result.name}-এর তথ্য আপডেট হয়েছে`
          : `${result.name} নতুন সদস্য হিসেবে যোগ হয়েছে`,
      );
      onClose();
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ");
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="handle" />
        <label className="lbl">
          নাম <i>*</i>
        </label>
        <input
          className="field"
          placeholder="যেমন: রাহুল ইসলাম"
          {...register("name", { required: true })}
        />
        <label className="lbl">
          ফোন নম্বর <i>*</i>
        </label>
        <input
          className="field"
          placeholder="Phone number"
          inputMode="tel"
          {...register("phone", { required: true })}
        />
        <label className="lbl">
          বর্তমান ঠিকানা <i>*</i>
        </label>
        <input
          className="field"
          placeholder="গ্রাম/এলাকা, থানা"
          {...register("address", { required: true })}
        />
        <label className="lbl">
          যোগদানের তারিখ <i>*</i>
        </label>
        <input
          className="field"
          type="date"
          {...register("join", { required: true })}
          onChange={(e) => setValue("join", e.target.value)}
        />
        <label className="lbl">
          প্যাকেজ <i>*</i>
        </label>
        <select className="select" {...register("plan", { required: true })}>
          {PLAN_CODES.map((code, i) => (
            <option key={code} value={code}>
              {PLAN_LABELS[i]}
            </option>
          ))}
        </select>
        <p className="light" style={{ fontSize: 12 }}>
          মেয়াদ: {join && plan ? calcExpiry(join, plan) : "—"}
        </p>
        <button
          className="btn-red block"
          type="submit"
          disabled={isSubmitting}
          style={{ marginTop: 16 }}
        >
          {editing ? "আপডেট করুন" : "সদস্য তৈরি করুন"}
        </button>
      </form>
    </div>
  );
}
