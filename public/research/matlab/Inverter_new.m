%% ================================================================
% RAMAN DTS OPTICAL TRANSMITTER
% ================================================================

% Literature benchmark:
% Pradhan & Sahu, IET Optoelectronics, 2015
% DOI: 10.1049/iet-opt.2014.0048
%
% Published Raman-DTS system parameters include:
%   Pump wavelength = 1550 nm
%   Peak input power = 70 mW
%
% NOTE:
% The pulse width used in the present model is NOT copied from the
% paper. It is derived from the 0.5 m spatial-resolution requirement.

lambda_p = 1550e-9;             % Pump wavelength [m] [LIT]

P0_laser = 70e-3;               % Peak launched power [W] [LIT]

% Pulse repetition frequency.
% Retained from the Raman-DTS literature benchmark used in this model.

PRF = 10e3;                     % Pulse repetition frequency [Hz] [LIT]


%% ================================================================
% FIBRE GROUP INDEX AND PULSE WIDTH
% ================================================================

% Approximate group refractive index for telecom silica fibre.
%
% This should ultimately be replaced by the group index from the
% datasheet of the selected sensing fibre.

n_g = 1.468;                    % Group refractive index [-]
                                % [DATASHEET/CALIBRATION REQUIRED]


% Pulse width is derived from the desired spatial resolution:
%
%        delta_z = c0*tau_p/(2*n_g)
%
% therefore:
%
%        tau_p = 2*n_g*delta_z/c0
%
% This ensures consistency between the simulated pulse duration
% and the desired 0.5 m DTS spatial resolution.

tau_p = ...
    2*n_g*dz_DTS/c0;            % Optical pulse width [s] [DERIVED]


% Pulse timing quantities

pulse_period = ...
    1/PRF;                      % Pulse repetition period [s]

pulse_duty = ...
    tau_p * PRF;                % Duty cycle [-]

pulse_width_percent = ...
    100 * pulse_duty;           % Pulse width [%]


%% ================================================================
% FIBRE ATTENUATION
% ================================================================

% Literature benchmark:
% Pradhan & Sahu, IET Optoelectronics, 2015
%
% Published parameters:
%   Fibre/pump attenuation = 0.20 dB/km
%   Anti-Stokes attenuation = 0.40 dB/km

alpha_p_dB_km = 0.20;           % Pump attenuation [dB/km] [LIT]

alpha_AS_dB_km = 0.40;          % Anti-Stokes attenuation [dB/km] [LIT]


% A directly matched Stokes attenuation coefficient is not taken
% from the same parameter table.
%
% Therefore this remains an explicit model baseline rather than
% being labelled as a directly measured literature value.

alpha_S_dB_km = 0.20;           % Stokes attenuation [dB/km]
                                % [MODEL BASELINE]


%% ================================================================
% RAMAN FREQUENCY SHIFT
% ================================================================

% Raman shift of silica fibre.

raman_shift_cm = 440;           % Raman shift [cm^-1] [LIT]


% Convert from cm^-1 to m^-1

raman_shift_m = ...
    raman_shift_cm * 100;       % [m^-1]


% Raman frequency shift

delta_nu_R = ...
    c0 * raman_shift_m;         % [Hz] [DERIVED]


%% ================================================================
% RAMAN STOKES / ANTI-STOKES WAVELENGTHS
% ================================================================

% Pump optical frequency

nu_p = ...
    c0/lambda_p;                % [Hz]


% Raman-shifted optical frequencies

nu_S = ...
    nu_p - delta_nu_R;          % Stokes frequency [Hz]

nu_AS = ...
    nu_p + delta_nu_R;          % Anti-Stokes frequency [Hz]


% Corresponding wavelengths

lambda_S = ...
    c0/nu_S;                    % Stokes wavelength [m]

lambda_AS = ...
    c0/nu_AS;                   % Anti-Stokes wavelength [m]


%% ================================================================
% RAMAN BACKSCATTER PARAMETERS
% ================================================================

% IMPORTANT:
%
% Pradhan & Sahu report parameters including:
%
%   K_AS     = 4e-11
%   Gamma_AS = 4e-10
%
% However, these parameters belong to the complete Raman-DTS
% formulation used in that paper.
%
% They must NOT be substituted directly for beta_AS in the present
% simplified equation:
%
% P_AS_gen =
% P_pump_z * beta_AS * n_R * dz_DTS
%
% because the definitions are not mathematically identical.
%
% Therefore the published quantities are retained below only as
% literature-reference parameters.

K_AS_lit = 4e-11;               % Literature Raman parameter
                                % [REFERENCE ONLY]

Gamma_AS_lit = 4e-10;           % Literature capture parameter
                                % [REFERENCE ONLY]


% ------------------------------------------------
% Effective coefficients used by current model
% ------------------------------------------------
%
% These are EFFECTIVE model coefficients.
%
% They preserve the current reduced Raman-scattering formulation
% while the model is being validated.
%
% They must eventually be calibrated against either:
%
%   1. experimental Raman received-power data, or
%   2. a complete literature Raman-power formulation.
%
% DO NOT describe these values as directly measured literature
% backscatter coefficients.

beta_S = 1e-8;                  % Effective Stokes coefficient [1/m]
                                % [CALIBRATION REQUIRED]

beta_AS = 1e-8;                 % Effective anti-Stokes coefficient [1/m]
                                % [CALIBRATION REQUIRED]


%% ================================================================
% TIME-OF-FLIGHT QUANTITIES
% ================================================================

% One-way optical propagation time

tof_oneway = ...
    n_g .* z_DTS ./ c0;         % [s]


% Round-trip propagation time from each DTS position

tof_roundtrip = ...
    2 .* n_g .* z_DTS ./ c0;    % [s]


% Round-trip propagation time to end of fibre

tof_total = ...
    2*n_g*L_fibre/c0;           % [s]


% Check spatial resolution implied by pulse width

delta_z_pulse = ...
    c0*tau_p/(2*n_g);           % [m]


%% ================================================================
% PHOTODETECTOR / RECEIVER PARAMETERS
% ================================================================

% Literature benchmark:
%
% Pradhan & Sahu,
% IET Optoelectronics, 2015
% DOI: 10.1049/iet-opt.2014.0048
%
% Receiver parameter set:
%
%   Responsivity             = 1 A/W
%   Detector temperature     = 300 K
%   Dark current             = 2 nA
%   Load resistance          = 1 kOhm
%   Effective noise BW       = 1 GHz
%   Amplifier noise figure   = 2
%   APD ionisation ratio     = 0.7


% Photodetector responsivities

R_S = 1.0;                      % Stokes responsivity [A/W] [LIT]

R_AS = 1.0;                     % Anti-Stokes responsivity [A/W] [LIT]


% Receiver temperature

T_rx = 300;                     % [K] [LIT]


% Detector dark current

I_dark = 2e-9;                  % [A] [LIT]


% Equivalent receiver/load resistance

R_L = 1e3;                      % [Ohm] [LIT]


% Effective receiver noise bandwidth

B_rx = 1e9;                     % [Hz] [LIT]


% Amplifier noise figure

F_n = 2;                        % [-] [LIT]


% APD ionisation coefficient ratio

k_A = 0.7;                      % [-] [LIT]


%% ================================================================
% APD GAIN
% ================================================================

% Start with unity multiplication.
%
% This makes the present receiver equivalent to the PIN/unmultiplied
% baseline while the optical-power model is being validated.
%
% APD optimisation can be added after the baseline SNR is correct.

M_APD = 10;                      % APD multiplication gain [-]
                                % [DESIGN / SWEEP]


% APD excess-noise factor:
%
% F_A =
% k_A*M + (1-k_A)*(2 - 1/M)

F_A = ...
    k_A*M_APD + ...
    (1-k_A)*(2 - 1/M_APD);


%% ================================================================
% TIA PARAMETERS
% ================================================================

% IMPORTANT:
%
% R_L is the resistance appearing in the receiver noise model.
%
% R_f is the transimpedance amplifier feedback resistance.
%
% They are NOT assumed to be the same parameter.

R_f = 1e5;                      % TIA feedback resistance [Ohm]
                                % [DESIGN / DEVICE SELECTION REQUIRED]


% Temporary amplifier saturation limit.
%
% Replace with the output swing of the final selected TIA device.

V_sat = 5;                      % TIA output saturation [V]
                                % [DEVICE SELECTION REQUIRED]


%% ================================================================
% TRACE AVERAGING
% ================================================================

% Literature benchmark:
%
% A Raman-DTS experimental system reported averaging 4000 traces
% during acquisition.
%
% Averaging independent zero-mean noise reduces its standard
% deviation according to:
%
%       sigma_avg = sigma_single / sqrt(N_avg)

N_avg = 4000;                   % Number of averaged traces [LIT]


% Ideal noise-reduction factor

averaging_gain_linear = ...
    sqrt(N_avg);


% Corresponding ideal SNR improvement

averaging_gain_dB = ...
    20*log10(averaging_gain_linear);


%% ================================================================
% OPTIONAL SIMPLEX CODING
% ================================================================

% Keep coding DISABLED while validating the uncoded optical receiver.
%
% Bolognini et al. experimentally demonstrated 63-bit Simplex
% coding in Raman DTS and reported approximately 5.8 dB
% dynamic-range improvement.

simplex_length = 63;            % Code length [bits] [LIT]

simplex_reported_gain_dB = ...
    5.8;                        % Reported improvement [dB] [LIT]

enable_simplex = false;         % Coding currently disabled [DESIGN]


%% ================================================================
% LEGACY EMPIRICAL SNR
% ================================================================

% Disable the old artificial SNR parameter.
%
% Shot noise and thermal noise are now calculated physically by
% the receiver model, so adding an arbitrary SNR would double-count
% noise.

SNR_Raman_dB = NaN;


%% ================================================================
% RAMAN PARAMETER VALIDATION FLAGS
% ================================================================

% These flags document which quantities are already grounded and
% which still require calibration/device selection.

receiver_parameters_literature_grounded = true;

alpha_p_literature_grounded = true;

alpha_AS_literature_grounded = true;

P0_laser_literature_grounded = true;

N_avg_literature_grounded = true;


% Remaining calibration/device-selection work

beta_S_calibration_required = true;

beta_AS_calibration_required = true;

alpha_S_calibration_required = true;

n_g_datasheet_required = true;

R_f_device_selection_required = true;

V_sat_device_selection_required = true;