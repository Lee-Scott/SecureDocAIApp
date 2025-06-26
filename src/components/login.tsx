import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from '../enum/catch.key';
import type { IUserRequest } from '../models/ICredentials';
import type { IResponse } from '../models/IResponse';
import type { QrCodeRequest } from '../models/IUser';
import { userAPI } from '../service/UserService';



/**
 * Zod schema for validating login credentials
 */
const loginSchema = z.object({
  email: z.string().min(3, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .length(4, 'Password must be at least 4 characters'), 
});

/**
 * Zod schema for validating 6-digit QR code and userId
 */
const qrCodeSchema = z.object({
  qrCode1: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  qrCode2: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  qrCode3: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  qrCode4: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  qrCode5: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  qrCode6: z.string().min(1, 'QR Code is required').max(1, 'Only one digit per input'),
  userId: z.string().min(5, 'User ID is required')
});

/**
 * Login component for authenticating the user and handling optional 2FA via QR code
 */
const Login = () => {
  const location = useLocation();

  /**
   * Retrieve login status from localStorage
   */
  const isLoggedIn: boolean = JSON.parse(localStorage.getItem(Key.LOGGEDIN)!) as boolean || false;

  /**
   * RTK Query mutation hook for logging in the user
   */
  const [loginUser, { data, error, isLoading, isSuccess }] = userAPI.useLoginUserMutation();

  /**
   * RTK Query mutation hook for verifying QR code if MFA is enabled
   */
  const [verifyQrCode, { data: qrCodeData, error: qrCodeError, isLoading: qrCodeLoading, isSuccess: qrCodeSuccess }] =
    userAPI.useVerifyQrCodeMutation();

  /**
   * React Hook Form instance for the login form
   */
  const {
    register,
    handleSubmit,
    formState: form,
    getFieldState
  } = useForm<IUserRequest>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched'
  });

  /**
   * React Hook Form instance for the QR code verification form
   */
  const {
    register: qrCodeRegister,
    handleSubmit: submitQrCode,
    formState: qrCodeForm,
    getFieldState: getQrCodeField
  } = useForm<QrCodeRequest>({
    resolver: zodResolver(qrCodeSchema),
    mode: 'onTouched'
  });

  /**
   * Helper: Determine if a login form field is valid (touched and not invalid)
   */
  const isFieldValid = (fieldName: keyof IUserRequest): boolean =>
    getFieldState(fieldName, form).isTouched && !getFieldState(fieldName, form).invalid;

  /**
   * Helper: Determine if a QR code field is valid
   */
  const isQrCodeFieldValid = (fieldName: keyof QrCodeRequest): boolean =>
    getQrCodeField(fieldName, qrCodeForm).isTouched && !getQrCodeField(fieldName, qrCodeForm).invalid;

  /**
   * Handler: Submit login credentials
   */
  const handleLogin = (credentials: IUserRequest) => loginUser(credentials);

  /**
   * Handler: Submit concatenated QR code digits + userId to the backend
   */
  const onVerifyQrCode = async (qrCode: QrCodeRequest) => {
    qrCode = {
      ...qrCode,
      qrCode: `${qrCode.qrCode1}${qrCode.qrCode2}${qrCode.qrCode3}${qrCode.qrCode4}${qrCode.qrCode5}${qrCode.qrCode6}`
    };
    await verifyQrCode(qrCode);
  };

  /**
   * Redirect: If already logged in, navigate to previous location or homepage
   */
  if (isLoggedIn) {
    return location?.state?.from?.pathname
      ? <Navigate to={location.state.from.pathname} replace />
      : <Navigate to="/" replace />;
  }

  /**
   * Redirect: If login success and MFA not required, complete login
   */
  if (isSuccess && !data?.data.user.mfa) {
    localStorage.setItem(Key.LOGGEDIN, 'true');
    return location?.state?.from?.pathname
      ? <Navigate to={location.state.from.pathname} replace />
      : <Navigate to="/" replace />;
  }

  /**
   * Redirect: If QR code success and MFA was required, complete login
   */
  if (qrCodeSuccess && data?.data.user.mfa) {
    localStorage.setItem(Key.LOGGEDIN, 'true');
    return location?.state?.from?.pathname
      ? <Navigate to={location.state.from.pathname} replace />
      : <Navigate to="/" replace />;
  }

    /**
   * Render MFA form: If login was successful and MFA is enabled
   */
  if (isSuccess && data?.data.user.mfa) {
    return (
      <div className="container mtb">
        <div className="row justify-content-center mt-7">
          <div className="col-lg-5 text-center">
            {/* Branding/logo */}
            <a href="index.html">
              <img src="assets/img/svg/logo.svg" alt="Logo" />
            </a>

            <div className="card mt-5">
              <div className="card-body">
                <h4 className="mb-3">2-Step Verification</h4>

                {/* Show error if QR code verification fails */}
                {qrCodeError && (
                  <div className="alert alert-dismissible alert-danger">
                    {'data' in qrCodeError
                      ? (qrCodeError.data as IResponse<void>).message
                      : 'An error occurred'}
                  </div>
                )}

                <hr />

                {/* Lock icon */}
                <div className="svg-icon svg-icon-xl text-purple">
                  <i className="bi bi-lock fs-3 text"></i>
                </div>

                {/* QR Code Input Form */}
                <form onSubmit={submitQrCode(onVerifyQrCode)} className="needs-validation" noValidate>
                  <label className="form-label">Please enter QR code</label>

                  <div className="row mt-4 pt-2">
                    {/* Hidden input for userId */}
                    <input
                      type="hidden"
                      {...qrCodeRegister('userId')}
                      defaultValue={data.data.user.userId}
                      name="userId"
                      id="userId"
                      required
                    />

                    {/* Render 6 individual input fields for QR code digits */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div className="col" key={i}>
                        <input
                          type="text"
                          {...qrCodeRegister(`qrCode${i}` as keyof QrCodeRequest)}
                          name={`qrCode${i}`}
                          className={`form-control text-center
                            ${qrCodeForm.errors[`qrCode${i}` as keyof QrCodeRequest] ? 'is-invalid' : ''}
                            ${isQrCodeFieldValid(`qrCode${i}` as keyof QrCodeRequest) ? 'is-valid' : ''}`}
                          id={`qrCode${i}`}
                          maxLength={1}
                          required
                          autoFocus={i === 1}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Submit button for QR verification */}
                  <div className="col mt-3">
                    <button
                      disabled={!qrCodeForm.isValid || qrCodeForm.isSubmitting || qrCodeLoading}
                      className="btn btn-primary btn-block"
                      type="submit"
                    >
                      {(qrCodeForm.isSubmitting || qrCodeLoading) && (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                      )}
                      <span role="status">
                        {(qrCodeForm.isSubmitting || qrCodeLoading) ? 'Loading...' : 'Verify'}
                      </span>
                    </button>
                  </div>
                </form>

                <hr className="my-3" />

                {/* Footer links */}
                <div className="row mb-3">
                  <div className="col d-flex justify-content-start">
                    <div className="btn btn-outline-light">
                      <Link to="/register" style={{ textDecoration: 'none' }}>
                        Create an Account
                      </Link>
                    </div>
                  </div>
                  <div className="col d-flex justify-content-end">
                    <div className="link-dark">
                      <Link to="/resetpassword">Forgot password?</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render default login form
   */
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-6 col-sm-12" style={{ marginTop: '150px' }}>
          <div className="card">
            <div className="card-body">
              <h4 className="mb-3">Login</h4>

              {/* Display login error */}
              {error && (
                <div className="alert alert-dismissible alert-danger">
                  {'data' in error
                    ? (error.data as IResponse<void>).message
                    : 'An error occurred'}
                </div>
              )}

              <hr />

              {/* Login Form */}
              <form onSubmit={handleSubmit(handleLogin)} className="needs-validation" noValidate>
                <div className="row g-3">
                  {/* Email Field */}
                  <div className="col-12">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="text"
                        {...register('email')}
                        name="email"
                        autoComplete="on"
                        className={`form-control ${form.errors.email ? 'is-invalid' : ''} 
                          ${isFieldValid('email') ? 'is-valid' : ''}`}
                        id="email"
                        placeholder="Email address"
                        required
                      />
                      <div className="invalid-feedback">{form.errors.email?.message}</div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="col-12">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text">
                        <i className="bi bi-key"></i>
                      </span>
                      <input
                        type="password"
                        {...register('password')}
                        name="password"
                        autoComplete="on"
                        className={`form-control ${form.errors.password ? 'is-invalid' : ''} 
                          ${isFieldValid('password') ? 'is-valid' : ''}`}
                        placeholder="Password"
                        required
                      />
                      <div className="invalid-feedback">{form.errors.password?.message}</div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="col mt-3">
                  <button
                    disabled={form.isSubmitting || isLoading}
                    className="btn btn-primary btn-block"
                    type="submit"
                  >
                    {(form.isSubmitting || isLoading) && (
                      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    )}
                    <span role="status">
                      {(form.isSubmitting || isLoading) ? 'Loading...' : 'Login'}
                    </span>
                  </button>
                </div>
              </form>

              <hr className="my-3" />

              {/* Footer links */}
              <div className="row mb-3">
                <div className="col d-flex justify-content-start">
                  <div className="btn btn-outline-light">
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                      Create an Account
                    </Link>
                  </div>
                </div>
                <div className="col d-flex justify-content-end">
                  <div className="link-dark">
                    <Link to="/resetpassword">Forgot password?</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
