%% DEGRADED THERMAL FEATURE PLOTS
clear;
clc;
close all;

%% Degradation levels
severity = {'Healthy','Mild','Moderate','Severe'};
x = 1:4;

%% Extracted feature values

% Peak temperature (K)
Tmax = [302.2776 302.5723 302.8669 303.4556];

% Temperature rise (K)
DeltaT = [4.1276 4.4223 4.7169 5.3056];

% Maximum derivative from supplied derivative files
MaxGradient = [584.6016 584.6016 584.6016 584.6016];

% 10%-90% rise time (s)
RiseTime = [23.5694 23.3836 23.2540 23.1399];

% Steady-state temperature (K)
SteadyTemp = [302.2705 302.5648 302.8589 303.4464];

% AUC above baseline (K.s)
AUC = [212.0946 227.6217 242.9723 273.1456];

%% ==============================================================
%  FIGURE 1: ALL USEFUL DEGRADATION FEATURES
% ==============================================================

figure('Color','w');

tiledlayout(2,3);

%% Peak temperature
nexttile
plot(x,Tmax,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('Peak Temperature (K)')
title('Peak Temperature vs Degradation')

xlim([0.7 4.3])

%% Temperature rise
nexttile
plot(x,DeltaT,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('\DeltaT (K)')
title('Temperature Rise vs Degradation')

xlim([0.7 4.3])

%% Maximum gradient
nexttile
plot(x,MaxGradient,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('Maximum Derivative')
title('Maximum Thermal Gradient')

xlim([0.7 4.3])

%% Rise time
nexttile
plot(x,RiseTime,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('Rise Time (s)')
title('10%-90% Rise Time')

xlim([0.7 4.3])

%% Steady temperature
nexttile
plot(x,SteadyTemp,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('Steady Temperature (K)')
title('Steady Temperature vs Degradation')

xlim([0.7 4.3])

%% AUC
nexttile
plot(x,AUC,'-o',...
    'LineWidth',2,...
    'MarkerSize',8,...
    'MarkerFaceColor','auto');

grid on
box on

xticks(x)
xticklabels(severity)

xlabel('Degradation Level')
ylabel('AUC (K s)')
title('Thermal Exposure vs Degradation')

xlim([0.7 4.3])

sgtitle('Thermal Features Across Degradation Levels',...
    'FontSize',14,...
    'FontWeight','bold');

%% NORMALISED DEGRADATION COMPARISON

Tmax_norm = 100*Tmax/Tmax(1);
DeltaT_norm = 100*DeltaT/DeltaT(1);
RiseTime_norm = 100*RiseTime/RiseTime(1);
Steady_norm = 100*SteadyTemp/SteadyTemp(1);
AUC_norm = 100*AUC/AUC(1);

figure('Color','w');

plot(x,Tmax_norm,'-o','LineWidth',2,'MarkerSize',7);
hold on

plot(x,DeltaT_norm,'-s','LineWidth',2,'MarkerSize',7);
plot(x,RiseTime_norm,'-d','LineWidth',2,'MarkerSize',7);
plot(x,Steady_norm,'-^','LineWidth',2,'MarkerSize',7);
plot(x,AUC_norm,'-x','LineWidth',2,'MarkerSize',8);

hold off

grid on
box on

xticks(x)
xticklabels(severity)

xlim([0.7 4.3])

xlabel('Degradation Level')
ylabel('Relative Feature Value (% of Healthy)')

title('Thermal Feature Progression with Degradation')

legend( ...
    'Peak Temperature', ...
    '\DeltaT', ...
    'Rise Time', ...
    'Steady Temperature', ...
    'AUC', ...
    'Location','northwest');

yline(100,'--','Healthy baseline');

set(gca,'FontSize',11);

