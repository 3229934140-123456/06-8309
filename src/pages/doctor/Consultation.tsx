import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Stethoscope,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react'
import { api } from '@/utils/api'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'
import type { Appointment, HealthProfile, Prescription } from '@shared/types'

interface PrescriptionForm {
  medicine_name: string
  dosage: string
  frequency: string
  duration_days: number
  remarks: string
}

const emptyPrescription: PrescriptionForm = {
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration_days: 7,
  remarks: '',
}

export default function Consultation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { doctor } = useDoctorProfile()
  const stateAppointment = (location.state as { appointment?: Appointment })?.appointment

  const [appointment, setAppointment] = useState<Appointment | null>(stateAppointment || null)
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(!stateAppointment)
  const [saving, setSaving] = useState(false)

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [prescriptions, setPrescriptions] = useState<PrescriptionForm[]>([{ ...emptyPrescription }])

  useEffect(() => {
    if (!appointment && id) {
      api
        .get<Appointment>(`/appointments/${id}`)
        .then((data) => {
          setAppointment(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [id, appointment])

  useEffect(() => {
    if (appointment?.patient_id) {
      api
        .get<HealthProfile>(`/health-profiles/${appointment.patient_id}`)
        .then(setHealthProfile)
        .catch(() => {})
    }
  }, [appointment])

  const addPrescription = () => {
    setPrescriptions((prev) => [...prev, { ...emptyPrescription }])
  }

  const removePrescription = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePrescription = (index: number, field: keyof PrescriptionForm, value: string | number) => {
    setPrescriptions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const handleSave = async () => {
    if (!appointment || !doctor) return
    setSaving(true)
    try {
      await api.post('/consultations', {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: doctor.id,
        chief_complaint: chiefComplaint,
        diagnosis,
        prescriptions: prescriptions.filter((p) => p.medicine_name.trim()),
      })
      navigate('/doctor')
    } catch {
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
        <AlertTriangle size={32} className="mb-2" />
        <p className="font-serif text-lg">未找到预约信息</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Stethoscope size={24} className="text-primary" />
        <h1 className="font-serif text-2xl font-semibold text-gray-800">接诊记录</h1>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HeartPulse size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-lg font-semibold text-gray-800">
              {appointment.patient?.name || `患者 #${appointment.patient_id}`}
            </h2>
            <p className="text-sm text-gray-500">
              预约时段：{appointment.slot?.start_time} - {appointment.slot?.end_time}
            </p>
          </div>
        </div>

        {healthProfile && (
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-warmwhite p-4">
            <div>
              <p className="text-xs text-gray-500">血型</p>
              <p className="text-sm font-medium text-gray-800">{healthProfile.blood_type || '未填写'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">过敏史</p>
              <p className="text-sm font-medium text-gray-800">
                {healthProfile.allergies?.length > 0 ? healthProfile.allergies.join('、') : '无'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">慢性病史</p>
              <p className="text-sm font-medium text-gray-800">
                {healthProfile.chronic_diseases?.length > 0
                  ? healthProfile.chronic_diseases.join('、')
                  : '无'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-3 font-serif text-lg font-semibold text-gray-800">主诉</h3>
        <textarea
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          rows={3}
          placeholder="请描述患者主诉..."
          className="w-full rounded-xl border border-gray-200 bg-warmwhite px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-3 font-serif text-lg font-semibold text-gray-800">诊断</h3>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={3}
          placeholder="请填写诊断结果..."
          className="w-full rounded-xl border border-gray-200 bg-warmwhite px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-gray-800">处方</h3>
          <button
            onClick={addPrescription}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Plus size={14} />
            添加药品
          </button>
        </div>

        <div className="space-y-4">
          {prescriptions.map((rx, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-warmwhite p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">药品 #{index + 1}</span>
                {prescriptions.length > 1 && (
                  <button
                    onClick={() => removePrescription(index)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">药品名称</label>
                  <input
                    type="text"
                    value={rx.medicine_name}
                    onChange={(e) => updatePrescription(index, 'medicine_name', e.target.value)}
                    placeholder="药品名称"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">剂量</label>
                  <input
                    type="text"
                    value={rx.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                    placeholder="如：10mg"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">用药频率</label>
                  <input
                    type="text"
                    value={rx.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                    placeholder="如：每日三次"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">用药天数</label>
                  <input
                    type="number"
                    value={rx.duration_days}
                    onChange={(e) =>
                      updatePrescription(index, 'duration_days', parseInt(e.target.value) || 0)
                    }
                    min={1}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">备注</label>
                  <input
                    type="text"
                    value={rx.remarks}
                    onChange={(e) => updatePrescription(index, 'remarks', e.target.value)}
                    placeholder="备注（可选）"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? '保存中...' : '保存就诊记录'}
      </button>
    </div>
  )
}
