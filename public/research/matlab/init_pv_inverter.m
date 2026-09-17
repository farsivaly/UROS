%% =========================================================
% PHYSICS-INFORMED INVERTER DIGITAL TWIN INITIALISATION
% =========================================================
%
% Includes:
%   - Three-phase inverter electrical parameters
%   - Wye-connected load
%   - Conduction-loss model
%   - Switching-loss model
%   - Internal thermal degradation
%   - Thermal-interface degradation
%   - Semiconductor ageing
%   - Raman DTS spatial/attenuation parameters
%
% =========================================================


%% =========================================================
% Three-phase inverter parameters
% =========================================================

Vdc = 600;                  % DC-link voltage [V]

Cdc = 2e-3;                 % DC-link capacitance [F]

f_out = 50;                 % Output electrical frequency [Hz]

f_sw = 2000;                % Switching frequency [Hz]

Ts_pwm = 5e-5;              % PWM sample time [s]

m = 0.8;                    % Modulation index
                            % Keep fixed for current operating sweep

% PWM voltage reference
Vref_peak = m * Vdc / 2;    % Peak phase reference voltage [V]

% Simulation duration
t_stop_inverter = 60;       % Inverter simulation duration [s]


%% =========================================================
% Wye-connected load parameters
% =========================================================

% The Simscape Wye-Connected Load is parameterised by
% rated voltage, real power and reactive power.
%
% Use these variable names directly inside the load block.

Vload_rated = 400;          % Rated three-phase load voltage [V]

Pload = 2000;               % Three-phase real load power [W]

Qind = 1e-2;                % Inductive reactive power [var]

Qcap = -1e-2;               % Capacitive reactive power [var]

f_load = f_out;             % Rated load frequency [Hz]


%% =========================================================
% Semiconductor conduction-loss parameters
% =========================================================

% Healthy IGBT electrical parameters

Vf_IGBT_healthy = 0.8;      % Forward voltage drop [V]

Ron_IGBT_healthy = 1e-3;    % On-state resistance [Ohm]


%% =========================================================
% Semiconductor ageing model
% =========================================================

% Ageing multipliers
%
% 1.00 = healthy semiconductor
%
% These can later be increased to represent semiconductor
% degradation / ageing.

alpha_Vf = 1.00;

alpha_Ron = 1.00;


% Effective degraded semiconductor parameters

Vf_IGBT = ...
    alpha_Vf * Vf_IGBT_healthy;

Ron_IGBT = ...
    alpha_Ron * Ron_IGBT_healthy;


%% =========================================================
% IGBT switching-loss parameters
% =========================================================

% Representative switching transition times
%
% These values are currently based on a representative
% 600-V-class IGBT and may later be replaced with parameters
% from the final selected device datasheet.

tr_IGBT = 11e-9;            % Switching rise time [s]

tf_IGBT = 63e-9;            % Switching fall time [s]


% Total switching transition duration

t_sw_IGBT = ...
    tr_IGBT + tf_IGBT;


% Switching-loss coefficient
%
% First-order switching-loss model:
%
% Psw_phase =
% Vdc * abs(I_phase) * f_sw * (tr_IGBT + tf_IGBT)
%
% Therefore:
%
% Ksw = f_sw * (tr_IGBT + tf_IGBT)

Ksw = ...
    f_sw * t_sw_IGBT;


%% =========================================================
% Inverter semiconductor loss equations
% =========================================================

% These equations are implemented inside Simulink.
%
% ---------------------------------------------------------
% Conduction loss per conducting IGBT:
%
% Pcond_device =
% g * (Vf_IGBT*abs(I) + Ron_IGBT*I^2)
%
% where:
%
% g = 1 when the semiconductor is conducting
% g = 0 otherwise
%
% ---------------------------------------------------------
% Total conduction loss:
%
% Pcond_total =
% PAH + PAL + PBH + PBL + PCH + PCL
%
% ---------------------------------------------------------
% Approximate switching loss per phase leg:
%
% Psw_phase =
% Vdc * abs(I_phase) * Ksw
%
% Therefore:
%
% Psw_total =
% Psw_A + Psw_B + Psw_C
%
% ---------------------------------------------------------
% Total inverter semiconductor heat generation:
%
% Ploss_total =
% Pcond_total + Psw_total
%
% This total loss is supplied to the thermal network
% through a Controlled Heat Flow Rate Source.


%% =========================================================
% Thermal model parameters
% =========================================================

% Healthy Cauer thermal resistances

Rth1_h = 0.05;              % K/W

Rth2_h = 0.10;              % K/W

Rth3_h = 0.20;              % K/W


% Thermal capacitances

Cth1 = 2;                   % J/K

Cth2 = 10;                  % J/K

Cth3 = 50;                  % J/K


%% =========================================================
% Internal thermal degradation model
% =========================================================

% Degradation severity:
%
% 1.00 = Healthy
% 1.25 = Mild
% 1.50 = Moderate
% 2.00 = Severe
%
% Default should remain healthy.
% Dataset sweep scripts can overwrite this value.

alpha_deg = 1.00;


% Internal degradation is currently applied to Rth2 only

Rth1 = Rth1_h;

Rth2 = ...
    alpha_deg * Rth2_h;

Rth3 = Rth3_h;


% Parameters supplied to Cauer Thermal Model block

Rth = ...
    [Rth1 Rth2 Rth3];

Cth = ...
    [Cth1 Cth2 Cth3];


% Individual thermal time constants

tau_th = ...
    Rth .* Cth;


%% =========================================================
% Thermal interface parameters
% =========================================================

% Healthy interface resistance

Rinterface_h = 0.02;        % K/W


% Interface degradation multiplier
%
% 1.00 = healthy interface
%
% This can later be increased for interface-degradation
% datasets.

alpha_interface = 1.00;


% Effective interface thermal resistance

Rinterface = ...
    alpha_interface * Rinterface_h;


%% =========================================================
% Temperature conditions
% =========================================================

Ta = 25;                    % Ambient temperature [degC]

Ta_K = ...
    Ta + 273.15;            % Ambient temperature [K]


% Initial temperatures of the three Cauer thermal nodes

Tinit = ...
    Ta_K * ones(1,3);


%% =========================================================
% Thermal network standalone test parameters
% =========================================================

% Only for standalone thermal-network testing.
%
% IMPORTANT:
% This fixed heat source should NOT drive the main inverter
% simulations once electrical semiconductor losses are
% connected to the Controlled Heat Flow Rate Source.

Ptest_Thermal_Network = 50; % Test heat input [W]

t_stop_thermal = 60;        % Thermal simulation duration [s]


%% =========================================================
% Raman / fibre thermal-response parameters
% =========================================================

% Response Time Index
%
% Current assumption adapted from tunnel/fire applications.
% To be refined later for inverter-mounted optical fibre.

RTI = 90;


%% =========================================================
% Raman DTS spatial model
% =========================================================

L_fibre = 20;               % Fibre length [m]

dx = 0.5;                   % Spatial sampling interval [m]


% Fibre spatial coordinates

x_fibre = ...
    0:dx:L_fibre;


% Number of DTS spatial channels

N_fibre = ...
    numel(x_fibre);


% Fibre background follows current ambient temperature

T_ambient_fibre = ...
    Ta_K;


% Inverter sensing region

x_inv_start = 5;            % Start position [m]

x_inv_end = 7;              % End position [m]


% Logical mask for inverter sensing region

idx_inv = ...
    (x_fibre >= x_inv_start) & ...
    (x_fibre <= x_inv_end);


%% =========================================================
% Raman DTS attenuation parameters
% =========================================================

% Current attenuation assumptions

alpha_p_dB_km = 0.20;       % Pump attenuation [dB/km]

alpha_AS_dB_km = 0.26;      % Anti-Stokes attenuation [dB/km]

alpha_S_dB_km = 0.24;       % Stokes attenuation [dB/km]


% Noise parameter
%
% Noise remains disabled for the baseline ML dataset unless
% explicitly enabled in the Raman model.

SNR_Raman_dB = 15;          % Raman signal SNR [dB]


% Fibre position converted to kilometres

x_fibre_km = ...
    x_fibre / 1000;


%% =========================================================
% Diagnostic display
% =========================================================

fprintf('\n========================================\n');
fprintf('Inverter Digital Twin Initialised\n');
fprintf('========================================\n');

fprintf('Vdc              = %.1f V\n', Vdc);
fprintf('Pload            = %.1f W\n', Pload);
fprintf('f_sw             = %.1f Hz\n', f_sw);
fprintf('Modulation index = %.2f\n', m);

fprintf('\nSemiconductor parameters:\n');

fprintf('Vf_IGBT           = %.4f V\n', ...
    Vf_IGBT);

fprintf('Ron_IGBT          = %.6f Ohm\n', ...
    Ron_IGBT);

fprintf('tr_IGBT           = %.3e s\n', ...
    tr_IGBT);

fprintf('tf_IGBT           = %.3e s\n', ...
    tf_IGBT);

fprintf('Ksw               = %.3e\n', ...
    Ksw);

fprintf('\nThermal parameters:\n');

fprintf('alpha_deg         = %.2f\n', ...
    alpha_deg);

fprintf('Rth2              = %.4f K/W\n', ...
    Rth2);

fprintf('Rinterface        = %.4f K/W\n', ...
    Rinterface);

fprintf('Ambient           = %.1f degC\n', ...
    Ta);

fprintf('========================================\n\n');

%% ================================================================
% RAMAN DTS / OPTICAL INTERROGATOR PARAMETERS
%% ================================================================

%% Fibre geometry
L_fibre = 20;          % Fibre length [m]
dz_DTS  = 0.5;         % Spatial discretisation / nominal resolution [m]

z_DTS = (0:dz_DTS:L_fibre).';   % Position vector [m]
N_DTS = numel(z_DTS);            % Number of spatial channels

%% Optical transmitter
lambda_p = 1550e-9;    % Pump wavelength [m]

P0_laser = 0.1;        % Peak launched optical power [W]
tau_p    = 5e-9;       % Optical pulse width [s]
PRF      = 10e3;       % Pulse repetition frequency [Hz]

pulse_period = 1/PRF;
pulse_duty   = tau_p * PRF;
pulse_width_percent = 100 * pulse_duty;

%% Fibre optical properties
n_g = 1.468;                   % Approximate group refractive index

alpha_p_dB_km  = 0.20;         % Pump attenuation [dB/km]
alpha_S_dB_km  = 0.24;         % Stokes attenuation [dB/km]
alpha_AS_dB_km = 0.26;         % Anti-Stokes attenuation [dB/km]

%% Raman shift
raman_shift_cm = 440;           % Raman shift [cm^-1]

c0 = 2.99792458e8;              % Speed of light [m/s]
h  = 6.62607015e-34;            % Planck constant [J s]
kB = 1.380649e-23;              % Boltzmann constant [J/K]

raman_shift_m = raman_shift_cm * 100;   % Convert cm^-1 -> m^-1
delta_nu_R = c0 * raman_shift_m;        % Raman frequency shift [Hz]

%% Raman wavelengths
nu_p = c0/lambda_p;             % Pump optical frequency [Hz]

nu_S  = nu_p - delta_nu_R;      % Stokes frequency [Hz]
nu_AS = nu_p + delta_nu_R;      % Anti-Stokes frequency [Hz]

lambda_S  = c0/nu_S;            % Stokes wavelength [m]
lambda_AS = c0/nu_AS;           % Anti-Stokes wavelength [m]

%% Raman backscatter coefficients
%
% INITIAL MODEL VALUES ONLY.
% These should later be replaced/calibrated using literature,
% datasheet or experimental values.

beta_S  = 1e-8;                 % Stokes backscatter coefficient [1/m]
beta_AS = 1e-8;                 % Anti-Stokes backscatter coefficient [1/m]

%% Time-of-flight quantities
tof_oneway = n_g .* z_DTS ./ c0;          % One-way propagation time [s]
tof_roundtrip = 2 .* n_g .* z_DTS ./ c0;  % Round-trip arrival time [s]

tof_total = 2*n_g*L_fibre/c0;             % Round-trip time at fibre end [s]

%% Nominal spatial resolution from pulse width
delta_z_pulse = c0*tau_p/(2*n_g);          % [m]

%% Display key DTS settings
fprintf('\n');
fprintf('---------------- RAMAN DTS INITIALISATION ----------------\n');
fprintf('Fibre length             : %.2f m\n', L_fibre);
fprintf('Spatial step             : %.3f m\n', dz_DTS);
fprintf('DTS channels             : %d\n', N_DTS);
fprintf('Pump wavelength          : %.1f nm\n', lambda_p*1e9);
fprintf('Stokes wavelength        : %.1f nm\n', lambda_S*1e9);
fprintf('Anti-Stokes wavelength   : %.1f nm\n', lambda_AS*1e9);
fprintf('Raman shift              : %.3f THz\n', delta_nu_R/1e12);
fprintf('Laser peak power         : %.3f W\n', P0_laser);
fprintf('Pulse width              : %.3f ns\n', tau_p*1e9);
fprintf('PRF                      : %.1f kHz\n', PRF/1e3);
fprintf('Pulse-derived resolution : %.3f m\n', delta_z_pulse);
fprintf('Fibre round-trip time    : %.3f ns\n', tof_total*1e9);
fprintf('-----------------------------------------------------------\n');


% Photodiode 
R_S  = 0.9;   % A/W
R_AS = 0.9;   % A/W

q_e    = 1.602176634e-19;   % C
I_dark = 1e-9;              % A, initial assumption
B_rx   = 10e6;              % Hz, initial receiver bandwidth

%% Receiver noise parameters
T_rx = 298;          % Receiver electronics temperature [K]
R_L  = 1e3;          % Equivalent load / TIA resistance [ohm]
B_rx = 10e6;         % Receiver bandwidth [Hz]

q_e = 1.602176634e-19;   % Electron charge [C]
kB  = 1.380649e-23;      % Boltzmann constant [J/K]

R_f = 1e5;   % 100 kOhm
V_sat = 5;   % V